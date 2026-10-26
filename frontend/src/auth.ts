/**
 * PLACEHOLDER de identificação do usuário.
 * TODO: trocar pela autenticação real (AD/LDAP via API ou JWT) e obter o usuário do token.
 * Enquanto isso, o ID vem do localStorage (ou "usuario-demo").
 */
export function getUsuarioId(): string {
  try {
    return localStorage.getItem('usuarioId') ?? 'usuario-demo';
  } catch {
    return 'usuario-demo';
  }
}
