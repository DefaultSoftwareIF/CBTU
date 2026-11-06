package br.com.empresa.rodatrack.sync;

import static br.com.empresa.rodatrack.Fixtures.T0;
import static br.com.empresa.rodatrack.Fixtures.roda;
import static br.com.empresa.rodatrack.Fixtures.usinagem;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.empresa.rodatrack.roda.Roda;
import br.com.empresa.rodatrack.roda.RodaRepository;
import br.com.empresa.rodatrack.usinagem.Usinagem;
import br.com.empresa.rodatrack.usinagem.UsinagemRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SyncServiceTest {

    private static final Instant AGORA = Instant.parse("2026-10-26T20:00:00Z");

    @Mock RodaRepository rodas;
    @Mock UsinagemRepository usinagens;

    SyncService service;

    @BeforeEach
    void setUp() {
        service = new SyncService(rodas, usinagens, Clock.fixed(AGORA, ZoneOffset.UTC));
    }

    @Test
    void registroNovoEGravadoComCarimboDeRecebimento() {
        when(rodas.findById("RD-0417")).thenReturn(Optional.empty());
        when(usinagens.findById("u-1")).thenReturn(Optional.empty());

        PushResponse r = service.receber(new PushRequest(List.of(roda(T0)), List.of(usinagem("u-1", T0))));

        assertThat(r.rodasAceitas()).containsExactly("RD-0417");
        assertThat(r.usinagensAceitas()).containsExactly("u-1");
        ArgumentCaptor<Usinagem> salva = ArgumentCaptor.forClass(Usinagem.class);
        verify(usinagens).save(salva.capture());
        assertThat(salva.getValue().recebidoEm()).isEqualTo(AGORA);
    }

    @Test
    void reenvioDoMesmoRegistroEIgnoradoSemGravar() {
        // Idempotência: o aparelho pode reenviar o lote se a resposta se perdeu.
        when(rodas.findById("RD-0417")).thenReturn(Optional.of(roda(T0).paraDocumento(AGORA)));
        when(usinagens.findById("u-1")).thenReturn(Optional.of(usinagem("u-1", T0).paraDocumento(AGORA)));

        PushResponse r = service.receber(new PushRequest(List.of(roda(T0)), List.of(usinagem("u-1", T0))));

        assertThat(r.rodasIgnoradas()).containsExactly("RD-0417");
        assertThat(r.usinagensIgnoradas()).containsExactly("u-1");
        verify(rodas, never()).save(any());
        verify(usinagens, never()).save(any());
    }

    @Test
    void versaoMaisNovaSobrescreve() {
        when(usinagens.findById("u-1")).thenReturn(Optional.of(usinagem("u-1", T0).paraDocumento(AGORA)));

        PushResponse r = service.receber(new PushRequest(null, List.of(usinagem("u-1", T0.plusSeconds(60)))));

        assertThat(r.usinagensAceitas()).containsExactly("u-1");
        verify(usinagens).save(any(Usinagem.class));
    }

    @Test
    void versaoMaisAntigaEIgnorada() {
        when(usinagens.findById("u-1")).thenReturn(Optional.of(usinagem("u-1", T0.plusSeconds(60)).paraDocumento(AGORA)));

        PushResponse r = service.receber(new PushRequest(List.of(), List.of(usinagem("u-1", T0))));

        assertThat(r.usinagensIgnoradas()).containsExactly("u-1");
        verify(usinagens, never()).save(any());
    }

    @Test
    void listasNulasViramVazias() {
        PushRequest vazio = new PushRequest(null, null);
        assertThat(vazio.rodas()).isEmpty();
        assertThat(vazio.usinagens()).isEmpty();
    }

    @Test
    void baixarSemCursorTrazTudoEDevolveNovoCursor() {
        Roda r = roda(T0).paraDocumento(AGORA);
        when(rodas.findByRecebidoEmGreaterThanEqual(Instant.EPOCH)).thenReturn(List.of(r));
        when(usinagens.findByRecebidoEmGreaterThanEqual(Instant.EPOCH)).thenReturn(List.of());

        PullResponse resp = service.enviarAlteracoes(null);

        assertThat(resp.rodas()).extracting("id").containsExactly("RD-0417");
        assertThat(resp.usinagens()).isEmpty();
        assertThat(resp.cursor()).isEqualTo(AGORA);
    }

    @Test
    void baixarComCursorUsaOCursorRecebido() {
        Instant desde = Instant.parse("2026-10-26T19:00:00Z");
        when(rodas.findByRecebidoEmGreaterThanEqual(desde)).thenReturn(List.of());
        when(usinagens.findByRecebidoEmGreaterThanEqual(desde)).thenReturn(List.of());

        service.enviarAlteracoes(desde);

        verify(rodas).findByRecebidoEmGreaterThanEqual(desde);
        verify(usinagens).findByRecebidoEmGreaterThanEqual(desde);
    }
}
