package br.com.empresa.rodatrack.tue;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

/**
 * Representa um carro de passageiros do TUE, contendo truques.
 */
public record Carro(
        @NotBlank String carId,
        @NotEmpty @Valid List<Truque> truques
) {
}
