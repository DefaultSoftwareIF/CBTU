package br.com.empresa.rodatrack.roda;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Roda cadastrada. O _id é o código da roda (ex.: "RD-0417").
 * recebidoEm é carimbado pelo servidor e serve de cursor para o download incremental (não depende do relógio do aparelho).
 */
@Document("rodas")
public record Roda(
        @Id String id,
        String usuarioId,
        Medidas medidasIniciais,
        Instant criadoEm,
        Instant atualizadoEm,
        @Indexed Instant recebidoEm) {
}
