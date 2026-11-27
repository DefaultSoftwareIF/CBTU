package br.com.empresa.rodatrack.usinagem;

import br.com.empresa.rodatrack.roda.Medidas;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;

/** Formato que trafega na API (espelha UsinagemDto do front-end). */
public record UsinagemDto(
        @NotBlank @Size(max = 64) String id,
        @NotBlank @Size(max = 40) String rodaId,
        @NotBlank @Size(max = 100) String usuarioId,
        @NotBlank @Size(max = 100) String perfilNome,
        @NotNull @PositiveOrZero @Digits(integer = 4, fraction = 3) BigDecimal remocaoMm,
        @NotNull @Valid Medidas medidasAntes,
        @NotNull @Valid Medidas medidasApos,
        @NotBlank @Size(max = 32) String regraVersao,
        @NotNull Instant criadoEm,
        @NotNull Instant atualizadoEm) {

    public Usinagem paraDocumento(Instant recebidoEm) {
        return new Usinagem(id, rodaId, usuarioId, perfilNome, remocaoMm, medidasAntes, medidasApos,
                regraVersao, criadoEm, atualizadoEm, recebidoEm);
    }

    public static UsinagemDto de(Usinagem u) {
        return new UsinagemDto(u.id(), u.rodaId(), u.usuarioId(), u.perfilNome(), u.remocaoMm(),
                u.medidasAntes(), u.medidasApos(), u.regraVersao(), u.criadoEm(), u.atualizadoEm());
    }
}
