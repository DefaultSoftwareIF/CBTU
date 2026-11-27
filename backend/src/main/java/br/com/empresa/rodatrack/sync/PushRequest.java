package br.com.empresa.rodatrack.sync;

import br.com.empresa.rodatrack.roda.RodaDto;
import br.com.empresa.rodatrack.usinagem.UsinagemDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.util.List;

/** Lote enviado pelo aparelho. Qualquer uma das listas pode vir vazia. */
public record PushRequest(
        @Size(max = 500) List<@Valid RodaDto> rodas,
        @Size(max = 500) List<@Valid UsinagemDto> usinagens) {

    public PushRequest {
        rodas = rodas == null ? List.of() : rodas;
        usinagens = usinagens == null ? List.of() : usinagens;
    }
}
