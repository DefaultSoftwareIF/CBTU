package br.com.empresa.rodatrack.tue;

import br.com.empresa.rodatrack.roda.Medidas;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * Representa um eixo (rodeiro) contendo 2 rodas (esquerda e direita) e seu sensor associado (ATC/Hasler).
 */
public record Eixo(
        @NotBlank String axleId,
        @NotNull @Size(min = 2, max = 2) @Valid List<Medidas> rodas,
        @NotNull SensorTipo sensor
) {
}
