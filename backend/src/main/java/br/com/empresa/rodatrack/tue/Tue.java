package br.com.empresa.rodatrack.tue;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Representa um Trem Unidade Elétrica (TUE) completo, composto por múltiplos carros.
 */
@Document("tues")
public record Tue(
        @Id String tueId,
        @NotEmpty @Valid List<Carro> carros
) {
}
