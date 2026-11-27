package br.com.empresa.rodatrack.sync;

import br.com.empresa.rodatrack.roda.Roda;
import br.com.empresa.rodatrack.roda.RodaDto;
import br.com.empresa.rodatrack.roda.RodaRepository;
import br.com.empresa.rodatrack.usinagem.Usinagem;
import br.com.empresa.rodatrack.usinagem.UsinagemDto;
import br.com.empresa.rodatrack.usinagem.UsinagemRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class SyncService {

    private final RodaRepository rodas;
    private final UsinagemRepository usinagens;
    private final Clock clock;

    public SyncService(RodaRepository rodas, UsinagemRepository usinagens, Clock clock) {
        this.rodas = rodas;
        this.usinagens = usinagens;
        this.clock = clock;
    }

    /**
     * Grava o que o aparelho enviou. Idempotente: reenviar o mesmo registro não duplica nem altera nada.
     * Conflito: vale a versão com atualizadoEm mais recente (last-write-wins).
     */
    public PushResponse receber(PushRequest pedido) {
        Instant agora = clock.instant();
        List<String> rodasAceitas = new ArrayList<>();
        List<String> rodasIgnoradas = new ArrayList<>();
        List<String> usinagensAceitas = new ArrayList<>();
        List<String> usinagensIgnoradas = new ArrayList<>();

        for (RodaDto dto : pedido.rodas()) {
            boolean grava = rodas.findById(dto.id())
                    .map(atual -> dto.atualizadoEm().isAfter(atual.atualizadoEm()))
                    .orElse(true);
            if (grava) {
                rodas.save(dto.paraDocumento(agora));
                rodasAceitas.add(dto.id());
            } else {
                rodasIgnoradas.add(dto.id());
            }
        }

        for (UsinagemDto dto : pedido.usinagens()) {
            boolean grava = usinagens.findById(dto.id())
                    .map(atual -> dto.atualizadoEm().isAfter(atual.atualizadoEm()))
                    .orElse(true);
            if (grava) {
                usinagens.save(dto.paraDocumento(agora));
                usinagensAceitas.add(dto.id());
            } else {
                usinagensIgnoradas.add(dto.id());
            }
        }

        return new PushResponse(rodasAceitas, rodasIgnoradas, usinagensAceitas, usinagensIgnoradas);
    }

    /** Tudo que o servidor recebeu a partir de "desde" (nulo = tudo). Pode repetir itens; o cliente é idempotente. */
    public PullResponse enviarAlteracoes(Instant desde) {
        // O cursor é tirado ANTES da consulta: o que chegar durante ela volta no próximo pull (nunca se perde).
        Instant cursor = clock.instant();
        Instant inicio = desde == null ? Instant.EPOCH : desde;

        List<RodaDto> r = rodas.findByRecebidoEmGreaterThanEqual(inicio).stream().map(RodaDto::de).toList();
        List<UsinagemDto> u = usinagens.findByRecebidoEmGreaterThanEqual(inicio).stream().map(UsinagemDto::de).toList();
        return new PullResponse(r, u, cursor);
    }
}
