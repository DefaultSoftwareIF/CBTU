package br.com.empresa.rodatrack.tue;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

/**
 * Representa um truque (bogie) contendo eixos (tipicamente 2 eixos por truque).
 */
public record Truque(
        @NotBlank String bogieId,
        @NotEmpty @Valid List<Eixo> eixos
) {
}
