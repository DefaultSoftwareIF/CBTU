package br.com.empresa.rodatrack;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.empresa.rodatrack.roda.Roda;
import br.com.empresa.rodatrack.usinagem.Usinagem;
import java.util.List;
import java.util.Set;
import org.bson.Document;
import org.bson.types.Decimal128;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;
import org.springframework.data.mongodb.core.convert.NoOpDbRefResolver;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;

/**
 * Confere, sem precisar de um MongoDB no ar, como os documentos são gravados:
 * _id vem do código/UUID, medidas viram Decimal128 e a leitura devolve o mesmo objeto.
 */
class MongoMappingTest {

    MappingMongoConverter conversor;

    @BeforeEach
    void setUp() {
        MongoMappingContext contexto = new MongoMappingContext();
        contexto.setInitialEntitySet(Set.of(Roda.class, Usinagem.class));
        contexto.afterPropertiesSet();

        conversor = new MappingMongoConverter(NoOpDbRefResolver.INSTANCE, contexto);
        conversor.setCustomConversions(new MongoCustomConversions(List.of()));
        conversor.afterPropertiesSet();
    }

    @Test
    void usinagemUsaUuidComoIdEMedidasComoDecimal128() {
        Usinagem original = Fixtures.usinagem("u-1", Fixtures.T0).paraDocumento(Fixtures.T0);

        Document doc = new Document();
        conversor.write(original, doc);

        assertThat(doc.get("_id")).isEqualTo("u-1");
        assertThat(doc.get("remocaoMm")).isInstanceOf(Decimal128.class);
        assertThat(((Document) doc.get("medidasAntes")).get("diametro")).isInstanceOf(Decimal128.class);

        assertThat(conversor.read(Usinagem.class, doc)).isEqualTo(original);
    }

    @Test
    void rodaUsaOCodigoComoId() {
        Roda original = Fixtures.roda(Fixtures.T0).paraDocumento(Fixtures.T0);

        Document doc = new Document();
        conversor.write(original, doc);

        assertThat(doc.get("_id")).isEqualTo("RD-0417");
        assertThat(conversor.read(Roda.class, doc)).isEqualTo(original);
    }
}
