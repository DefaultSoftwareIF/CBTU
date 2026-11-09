package br.com.empresa.rodatrack.usinagem;

import br.com.empresa.rodatrack.roda.Medidas;
import java.math.BigDecimal;
import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

/** Uma usinagem registrada. O _id é o UUID gerado no aparelho (garante idempotência do envio). */
@Document("usinagens")
@CompoundIndex(name = "roda_criadoEm", def = "{'rodaId': 1, 'criadoEm': 1}")
public record Usinagem(
        @Id String id,
        String rodaId,
        String usuarioId,
        String perfilNome,
        @Field(targetType = FieldType.DECIMAL128) BigDecimal remocaoMm,
        Medidas medidasAntes,
        Medidas medidasApos,
        String regraVersao,
        Instant criadoEm,
        Instant atualizadoEm,
        @Indexed Instant recebidoEm) {
}
