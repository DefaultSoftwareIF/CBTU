package br.com.empresa.rodatrack.roda;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;

/** Formato que trafega na API (espelha RodaDto do front-end). */
public record RodaDto(
        @NotBlank @Size(max = 40) @Pattern(regexp = "[A-Za-z0-9-]+") String id,
        @NotBlank @Size(max = 100) String usuarioId,
        @NotNull @Valid Medidas medidasIniciais,
        @NotNull Instant criadoEm,
        @NotNull Instant atualizadoEm) {

    public Roda paraDocumento(Instant recebidoEm) {
        return new Roda(id, usuarioId, medidasIniciais, criadoEm, atualizadoEm, recebidoEm);
    }

    public static RodaDto de(Roda r) {
        return new RodaDto(r.id(), r.usuarioId(), r.medidasIniciais(), r.criadoEm(), r.atualizadoEm());
    }
}
