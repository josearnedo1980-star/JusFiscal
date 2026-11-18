/* =========================================================
   JUSFISCAL · Núcleo Compartido (Ley 5121 - Ley 8467)
   Desarrollado por José Manuel Arnedo
   ========================================================= */

window.JUSFISCAL_TARIFAS = {
  minTasaProp: 4200,
  tasaIndeterminada: 6300,
  apersonamiento: 1000,
  intimacionBase: 1200,
  embargoBase: 1400,
  inspeccion: 2000,
  aceptacion: 2000,
  pericia: 2100,
  archivo: 1000,
  actuacion: 700
};

window.formatMoney = function (n) {
  return '$ ' + Number(n || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

window.toggleAccordion = function (id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('open');
};

/* Copiado enriquecido para SAE (Arial 12pt justificado + respaldo texto plano) */
window.copiarParaSAE = async function () {
  const contenedor = document.getElementById('salidaSAE');
  if (!contenedor) return;

  const htmlParaSAE = `<div style="font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5; text-align: justify; color: #000000;">${contenedor.innerHTML}</div>`;
  const textoPlano = contenedor.innerText;

  try {
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([htmlParaSAE], { type: 'text/html' }),
          'text/plain': new Blob([textoPlano], { type: 'text/plain' })
        })
      ]);
    } else {
      await navigator.clipboard.writeText(textoPlano);
    }
    const fb = document.getElementById('copyFeedback');
    if (fb) {
      fb.style.display = 'block';
      setTimeout(() => { fb.style.display = 'none'; }, 3500);
    }
  } catch (err) {
    alert('No se pudo acceder al portapapeles automáticamente. Seleccioná el texto del recuadro y presioná Ctrl+C.');
  }
};

/* =========================================================
   AUXILIAR DE CONTEO CON BITÁCORA CRONOLÓGICA POR PARTE
   ========================================================= */
window._jfDestinoConteo = 'actora';
window._jfBitacoras = {};

/* Máscara automática de fecha dd/mm/aaaa */
window.formatearFechaInput = function (inp) {
  let v = (inp.value || '').replace(/\D/g, '').slice(0, 8);
  if (v.length >= 2) {
    let dd = parseInt(v.slice(0, 2), 10);
    if (dd > 31) v = '31' + v.slice(2);
    if (dd === 0) v = '01' + v.slice(2);
  }
  if (v.length >= 4) {
    let mm = parseInt(v.slice(2, 4), 10);
    if (mm > 12) v = v.slice(0, 2) + '12' + v.slice(4);
    if (mm === 0) v = v.slice(0, 2) + '01' + v.slice(4);
  }
  if (v.length > 4) {
    inp.value = v.slice(0, 2) + '/' + v.slice(2, 4) + '/' + v.slice(4);
  } else if (v.length > 2) {
    inp.value = v.slice(0, 2) + '/' + v.slice(2);
  } else {
    inp.value = v;
  }
};

function normalizarFechaFinal(texto) {
  const digitos = (texto || '').replace(/\D/g, '');
  if (digitos.length === 8) {
    return digitos.slice(0, 2) + '/' + digitos.slice(2, 4) + '/' + digitos.slice(4, 8);
  }
  if (digitos.length === 6) {
    const yy = parseInt(digitos.slice(4, 6), 10);
    const yyyy = yy > 50 ? '19' + digitos.slice(4, 6) : '20' + digitos.slice(4, 6);
    return digitos.slice(0, 2) + '/' + digitos.slice(2, 4) + '/' + yyyy;
  }
  return (texto || '').trim() || 'S/F';
}

/* Avance/retroceso de fecha (por días o meses con Shift) */
window.desplazarFechaBitacora = function (delta, porMes) {
  const inp = document.getElementById('bitFecha');
  if (!inp) return;

  const norm = normalizarFechaFinal(inp.value);
  const partes = norm.split('/');
  let fechaObj;

  if (partes.length === 3 && partes[2].length === 4) {
    const d = parseInt(partes[0], 10);
    const m = parseInt(partes[1], 10) - 1;
    const y = parseInt(partes[2], 10);
    fechaObj = new Date(y, m, d);
  } else {
    fechaObj = new Date();
  }

  if (isNaN(fechaObj.getTime())) fechaObj = new Date();

  if (porMes) {
    fechaObj.setMonth(fechaObj.getMonth() + delta);
  } else {
    fechaObj.setDate(fechaObj.getDate() + delta);
  }

  const dd = String(fechaObj.getDate()).padStart(2, '0');
  const mm = String(fechaObj.getMonth() + 1).padStart(2, '0');
  const yyyy = fechaObj.getFullYear();
  inp.value = `${dd}/${mm}/${yyyy}`;
};

window.manejarRuedaFecha = function (e) {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 1 : -1;
  window.desplazarFechaBitacora(delta, e.shiftKey);
};

function asegurarModalBitacora() {
  let modal = document.getElementById('modalConteo');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modalConteo';
    modal.className = 'modal-backdrop';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="modal-card" style="max-width: 650px;">
      <div class="modal-header">
        <h3 id="modalConteoTitulo">🧮 Auxiliar Cronológico de Actuaciones</h3>
        <button type="button" class="modal-close" onclick="cerrarModalConteo()">✕</button>
      </div>

      <div class="bitacora-form">
        <div>
          <label for="bitFecha">Fecha (rueda mouse: ±1d)</label>
          <div style="display:flex; gap:4px; align-items:center;">
            <button type="button" onclick="desplazarFechaBitacora(-1, false)" title="Restar 1 día" style="padding:7px 8px; border:1px solid #cbd5e1; border-radius:8px; background:#fff; cursor:pointer; font-weight:700; color:#12345A;">-</button>
            <input type="text" id="bitFecha" placeholder="dd/mm/aaaa" maxlength="10" inputmode="numeric"
              oninput="formatearFechaInput(this)"
              onwheel="manejarRuedaFecha(event)"
              onkeydown="if(event.key==='Enter'){event.preventDefault();agregarItemBitacora();}else if(event.key==='ArrowUp'){event.preventDefault();desplazarFechaBitacora(1,event.shiftKey);}else if(event.key==='ArrowDown'){event.preventDefault();desplazarFechaBitacora(-1,event.shiftKey);}" />
            <button type="button" onclick="desplazarFechaBitacora(1, false)" title="Sumar 1 día" style="padding:7px 8px; border:1px solid #cbd5e1; border-radius:8px; background:#fff; cursor:pointer; font-weight:700; color:#12345A;">+</button>
          </div>
        </div>
        <div>
          <label for="bitTipo">Tipo de Actuación</label>
          <select id="bitTipo" onkeydown="if(event.key==='Enter'){event.preventDefault();agregarItemBitacora();}">
            <option value="Decreto">Decreto</option>
            <option value="Nota actuarial">Nota actuarial</option>
            <option value="Informe">Informe</option>
            <option value="Sentencia">Sentencia</option>
            <option value="Cédula">Cédula</option>
            <option value="Mandamiento">Mandamiento</option>
            <option value="Oficio">Oficio</option>
            <option value="Escrito vario">Escrito vario</option>
          </select>
        </div>
        <div>
          <label for="bitFojas">Fojas</label>
          <input type="number" id="bitFojas" min="1" value="1" onkeydown="if(event.key==='Enter'){event.preventDefault();agregarItemBitacora();}" />
        </div>
        <div>
          <button type="button" class="btn-add-bitacora" onclick="agregarItemBitacora()">+ Agregar</button>
        </div>
      </div>

      <div class="bitacora-ubicacion" id="bitUbicacionBar">
        <span>📍 Última posición revisada: <strong>Sin registros aún</strong></span>
        <span>0 movimientos</span>
      </div>

      <div class="bitacora-lista">
        <table class="bitacora-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Actuación / Movimiento</th>
              <th style="text-align:center;">Fojas</th>
              <th style="text-align:center;">Quitar</th>
            </tr>
          </thead>
          <tbody id="bitacoraBody"></tbody>
        </table>
      </div>

      <div class="modal-footer">
        <div class="modal-total-badge">TOTAL ACUMULADO: <span id="modalTotalNum">0</span> fojas</div>
        <div style="display:flex; gap:8px;">
          <button type="button" class="btn-secondary-jf" style="padding:8px 14px;" onclick="limpiarBitacoraActual()">Vaciar lista</button>
          <button type="button" class="btn-primary-jf" style="padding:8px 16px;" onclick="aplicarConteo()">Aplicar al Cálculo</button>
        </div>
      </div>
    </div>
  `;
}

window.abrirModalConteo = function (destino, tituloPersonalizado) {
  asegurarModalBitacora();
  window._jfDestinoConteo = destino || 'actora';
  if (!window._jfBitacoras[window._jfDestinoConteo]) {
    window._jfBitacoras[window._jfDestinoConteo] = [];
  }
  const tituloEl = document.getElementById('modalConteoTitulo');
  if (tituloEl) {
    tituloEl.textContent = tituloPersonalizado ||
      (window._jfDestinoConteo === 'actora'
        ? '🧮 Bitácora de Actuaciones — Parte Actora'
        : '🧮 Bitácora de Actuaciones — Parte Demandada');
  }

  const lista = window._jfBitacoras[window._jfDestinoConteo];
  const inpFecha = document.getElementById('bitFecha');
  if (inpFecha && lista.length > 0) {
    inpFecha.value = lista[lista.length - 1].fecha;
  }

  renderBitacora();
  document.getElementById('modalConteo').classList.add('active');
  if (inpFecha) inpFecha.focus();
};

window.cerrarModalConteo = function () {
  const modal = document.getElementById('modalConteo');
  if (modal) modal.classList.remove('active');
};

window.agregarItemBitacora = function () {
  const dest = window._jfDestinoConteo;
  if (!window._jfBitacoras[dest]) window._jfBitacoras[dest] = [];

  const fechaInp = document.getElementById('bitFecha');
  const tipoSel = document.getElementById('bitTipo');
  const fojasInp = document.getElementById('bitFojas');

  const fecha = normalizarFechaFinal(fechaInp.value);
  if (fecha !== 'S/F') fechaInp.value = fecha;
  const tipo = tipoSel.value;
  const fojas = Math.max(1, parseInt(fojasInp.value, 10) || 1);

  window._jfBitacoras[dest].push({ fecha, tipo, fojas });
  fojasInp.value = 1;
  renderBitacora();
  fechaInp.focus();
  fechaInp.select();
};

window.eliminarItemBitacora = function (idx) {
  const dest = window._jfDestinoConteo;
  if (!window._jfBitacoras[dest]) return;
  window._jfBitacoras[dest].splice(idx, 1);
  renderBitacora();
};

window.limpiarBitacoraActual = function () {
  const dest = window._jfDestinoConteo;
  window._jfBitacoras[dest] = [];
  renderBitacora();
};

window.limpiarModalConteo = function () {
  window._jfBitacoras = {};
  const totalEl = document.getElementById('modalTotalNum');
  if (totalEl) totalEl.textContent = '0';
};

window.actualizarTotalModal = function () {
  const dest = window._jfDestinoConteo;
  const lista = window._jfBitacoras[dest] || [];
  const suma = lista.reduce((acc, item) => acc + (item.fojas || 0), 0);
  const totalEl = document.getElementById('modalTotalNum');
  if (totalEl) totalEl.textContent = suma;
  return suma;
};

function renderBitacora() {
  const dest = window._jfDestinoConteo;
  const lista = window._jfBitacoras[dest] || [];
  const tbody = document.getElementById('bitacoraBody');
  const ubicBar = document.getElementById('bitUbicacionBar');

  if (!tbody) return;

  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:18px;">Cargá fecha, actuación y fojas para llevar el seguimiento del expediente.</td></tr>';
    if (ubicBar) ubicBar.innerHTML = '<span>📍 Última posición revisada: <strong>Sin registros aún</strong></span><span>0 movimientos</span>';
  } else {
    tbody.innerHTML = lista.map((item, i) => `
      <tr>
        <td><strong>${item.fecha}</strong></td>
        <td>${item.tipo}</td>
        <td style="text-align:center; font-weight:700; color:var(--primary);">${item.fojas}</td>
        <td style="text-align:center;"><button type="button" class="btn-del-item" onclick="eliminarItemBitacora(${i})">✕</button></td>
      </tr>
    `).join('');

    const ultimo = lista[lista.length - 1];
    if (ubicBar) {
      ubicBar.innerHTML = `<span>📍 Última posición revisada: <strong>${ultimo.fecha} · ${ultimo.tipo} (${ultimo.fojas} f.)</strong></span><span>${lista.length} movimiento(s)</span>`;
    }
    const contScroll = document.querySelector('.bitacora-lista');
    if (contScroll) contScroll.scrollTop = contScroll.scrollHeight;
  }

  window.actualizarTotalModal();
}

/* Protección de autoría */
(function () {
  const firma = 'José Manuel Arnedo';
  const validar = () => {
    const el = document.getElementById('autorFirma');
    if (!el || !el.textContent.includes(firma)) {
      document.body.innerHTML = '<div style="padding:40px; text-align:center; font-family:Segoe UI, sans-serif;"><h2>Firma de autor alterada</h2><p>Desarrollado por <strong>José Manuel Arnedo</strong>.</p></div>';
    }
  };
  window.addEventListener('DOMContentLoaded', validar);
  setInterval(validar, 3000);
})();