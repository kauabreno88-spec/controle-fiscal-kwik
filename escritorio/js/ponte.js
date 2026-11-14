/* KWIK Mini Escritório · ponte com o servidor do PC (Obsidian e Biblioteca).
   - Aberto por localhost (ABRIR-ESCRITORIO.bat): fala com o próprio servidor, como sempre.
   - Aberto pelo site publicado (github.io) num computador: procura o servidor em http://localhost:4880. Se ele estiver
     ligado, o Obsidian deste PC funciona igual. Na primeira vez o navegador pode perguntar se o site pode acessar
     "dispositivos da rede local": responda Permitir.
   - No celular não procura (o Obsidian fica no PC). */
(function () {
  const KM = (window.KM = window.KM || {});
  const LOCAL = 'http://localhost:4880';
  const celular = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
  let ligado = null, ultima = 0, promessa = null;
  const local = () => !!KM.ehPC;

  async function checar(forcar) {
    if (local()) return true;
    if (celular) return false;
    if (ligado === true && !forcar) return true;
    if (promessa) return promessa;
    if (!forcar && ligado === false && Date.now() - ultima < 10000) return false;
    promessa = (async () => {
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 3000);
      try {
        const r = await fetch(LOCAL + '/api/obsidian/ping', { cache: 'no-store', signal: ctl.signal, targetAddressSpace: 'loopback' });
        ligado = r.ok;
      } catch (e) { ligado = false; }
      clearTimeout(t); ultima = Date.now(); promessa = null;
      return ligado;
    })();
    return promessa;
  }

  // o navegador bloqueou o acesso à rede local para este site? ('granted' | 'prompt' | 'denied' | '')
  async function permissao() {
    for (const name of ['local-network-access', 'loopback-network']) {
      try { return (await navigator.permissions.query({ name })).state; } catch (e) { /* nome não existe neste navegador */ }
    }
    return '';
  }

  KM.ponte = {
    checar,
    permissao,
    base: () => (local() ? '' : LOCAL), // prefixo das rotas /api/obsidian/*
    ligado: () => local() || ligado === true,
    computador: () => local() || !celular, // dá para usar o Obsidian daqui (se o servidor estiver ligado)
  };
})();
