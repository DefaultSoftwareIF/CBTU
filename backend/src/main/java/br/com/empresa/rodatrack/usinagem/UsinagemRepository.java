package br.com.empresa.rodatrack.usinagem;

import java.time.Instant;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UsinagemRepository extends MongoRepository<Usinagem, String> {
    List<Usinagem> findByRecebidoEmGreaterThanEqual(Instant desde);
}
