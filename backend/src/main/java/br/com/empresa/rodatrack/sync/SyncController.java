package br.com.empresa.rodatrack.sync;

import jakarta.validation.Valid;
import java.time.Instant;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * TODO (segurança): ainda não há autenticação. Com AD/LDAP ou JWT, o usuarioId gravado deve vir do
 * usuário autenticado, e nunca do corpo da requisição; e cada endpoint precisa exigir login.
 */
@RestController
@RequestMapping("/api/sync")
public class SyncController {

    private final SyncService service;

    public SyncController(SyncService service) {
        this.service = service;
    }

    /** O aparelho envia o que registrou offline. */
    @PostMapping
    public PushResponse enviar(@Valid @RequestBody PushRequest pedido) {
        return service.receber(pedido);
    }

    /** O aparelho baixa o que mudou desde o último cursor (sem "since" = tudo). */
    @GetMapping
    public PullResponse baixar(@RequestParam(required = false) Instant since) {
        return service.enviarAlteracoes(since);
    }
}
