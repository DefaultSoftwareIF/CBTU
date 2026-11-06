package br.com.empresa.rodatrack.sync;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(SyncController.class)
class SyncControllerTest {

    private static final String MEDIDAS = """
            {"diametro":840.0,"aro":135.0,"frisoEspessura":28.0,"frisoAltura":30.0,"anguloEixo":1.2}""";

    private static String roda(String id) {
        return """
                {"id":"%s","usuarioId":"u1","medidasIniciais":%s,
                 "criadoEm":"2026-10-26T17:00:00.000Z","atualizadoEm":"2026-10-26T17:00:00.000Z"}"""
                .formatted(id, MEDIDAS);
    }

    private static String usinagem(String remocao) {
        return """
                {"id":"u-1","rodaId":"RD-0417","usuarioId":"u1","perfilNome":"AAR-1B NF","remocaoMm":%s,
                 "medidasAntes":%s,"medidasApos":%s,"regraVersao":"0.1.0-placeholder",
                 "criadoEm":"2026-10-26T17:00:00.000Z","atualizadoEm":"2026-10-26T17:00:00.000Z"}"""
                .formatted(remocao, MEDIDAS, MEDIDAS);
    }

    @Autowired MockMvc mvc;
    @MockitoBean SyncService service;

    @Test
    void enviarLoteValidoRetorna200() throws Exception {
        when(service.receber(any())).thenReturn(
                new PushResponse(List.of("RD-0417"), List.of(), List.of("u-1"), List.of()));

        mvc.perform(post("/api/sync").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rodas\":[" + roda("RD-0417") + "],\"usinagens\":[" + usinagem("1.8") + "]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rodasAceitas[0]").value("RD-0417"))
                .andExpect(jsonPath("$.usinagensAceitas[0]").value("u-1"));
    }

    @Test
    void remocaoNegativaRetorna400() throws Exception {
        mvc.perform(post("/api/sync").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rodas\":[],\"usinagens\":[" + usinagem("-1.0") + "]}"))
                .andExpect(status().isBadRequest());
        verify(service, never()).receber(any());
    }

    @Test
    void idDeRodaComCaracterInvalidoRetorna400() throws Exception {
        mvc.perform(post("/api/sync").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rodas\":[" + roda("RD 0417; drop") + "],\"usinagens\":[]}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void medidaZeradaRetorna400() throws Exception {
        String zerada = roda("RD-0417").replace("\"diametro\":840.0", "\"diametro\":0");
        mvc.perform(post("/api/sync").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rodas\":[" + zerada + "],\"usinagens\":[]}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void diametroNegativoDepoisDaUsinagemRetorna400() throws Exception {
        String impossivel = usinagem("1.8").replace("\"medidasApos\":{\"diametro\":840.0", "\"medidasApos\":{\"diametro\":-0.3");
        mvc.perform(post("/api/sync").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rodas\":[],\"usinagens\":[" + impossivel + "]}"))
                .andExpect(status().isBadRequest());
        verify(service, never()).receber(any());
    }

    @Test
    void baixarComSinceConverteOInstante() throws Exception {
        Instant since = Instant.parse("2026-10-26T19:00:00.123Z");
        when(service.enviarAlteracoes(since)).thenReturn(new PullResponse(List.of(), List.of(), since));

        mvc.perform(get("/api/sync").param("since", "2026-10-26T19:00:00.123Z"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cursor").value("2026-10-26T19:00:00.123Z"));
        verify(service).enviarAlteracoes(since);
    }

    @Test
    void baixarSemSinceTrazTudo() throws Exception {
        when(service.enviarAlteracoes(null)).thenReturn(new PullResponse(List.of(), List.of(), Instant.EPOCH));

        mvc.perform(get("/api/sync")).andExpect(status().isOk());
        verify(service).enviarAlteracoes(null);
    }
}
