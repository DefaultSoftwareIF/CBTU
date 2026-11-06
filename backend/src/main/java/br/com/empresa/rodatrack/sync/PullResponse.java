package br.com.empresa.rodatrack.sync;

import br.com.empresa.rodatrack.roda.RodaDto;
import br.com.empresa.rodatrack.usinagem.UsinagemDto;
import java.time.Instant;
import java.util.List;

/** cursor: o aparelho guarda e devolve em ?since= na próxima sincronização. */
public record PullResponse(List<RodaDto> rodas, List<UsinagemDto> usinagens, Instant cursor) {
}
