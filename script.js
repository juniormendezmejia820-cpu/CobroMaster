let clientes = JSON.parse(localStorage.getItem('cobro_master_data')) || [];

function f(n) { return new Number(n).toLocaleString('es-CO'); }

function agregarCliente() {
    const nombre = document.getElementById('nombre').value;
    let tel = document.getElementById('telefono').value.replace(/\D/g, '');
    const monto = parseFloat(document.getElementById('monto').value);
    const tasa = parseFloat(document.getElementById('tasaInteres').value);
    const fecha = document.getElementById('fechaPago').value;

    if(!nombre || isNaN(monto) || !fecha) { alert("Llena los datos."); return; }
    if (tel.length === 10) tel = '57' + tel;

    clientes.push({ 
        id: Date.now(), nombre, telefono: tel, capital: monto, tasa, 
        proximoPago: fecha, historial: [], abonosMesActual: 0 
    });

    guardarYRefrescar();
    document.querySelectorAll('input').forEach(i => i.value = '');
}

function marcarPago(id) {
    const abono = parseFloat(prompt("¿Cuánto dinero abonó hoy?"));
    if (isNaN(abono) || abono <= 0) return;

    clientes = clientes.map(c => {
        if (c.id === id) {
            const interesMes = c.tasa > 0 ? (c.capital * (c.tasa / 100)) : 0;
            const fechaHoy = new Date().toLocaleDateString('es-CO');
            c.historial.push({ fecha: fechaHoy, monto: abono });
            c.abonosMesActual += abono;
            const falta = interesMes - c.abonosMesActual;

            if (falta <= 0) {
                const exceso = Math.abs(falta);
                if (exceso > 0) { c.capital -= exceso; alert(`✅ Cuota lista. $${f(exceso)} al capital.`); }
                else { alert(`✅ Cuota pagada exacta.`); }
                c.abonosMesActual = 0;
                let f_next = new Date(c.proximoPago + "T00:00:00");
                f_next.setMonth(f_next.getMonth() + 1);
                c.proximoPago = f_next.toISOString().split('T')[0];
            } else {
                alert(`💰 Abono parcial. Faltan $${f(falta)} para la cuota.`);
            }
        }
        return c;
    });
    guardarYRefrescar();
}

// FUNCIÓN DE WHATSAPP RESTAURADA
function cobrar(nombre, telefono, capital, tasa, abonos) {
    const interes = capital * (tasa / 100);
    const pendiente = interes - abonos;
    let msg = "";
    
    if (tasa > 0) {
        msg = `Hola ${nombre}, paso a recordarte el saldo de tu cuota de intereses. Llevas abonado $${f(abonos)} y el saldo pendiente es $${f(pendiente)}. Quedo atento.`;
    } else {
        msg = `Hola ${nombre}, paso a recordarte el abono de tu préstamo. Quedo atento, muchas gracias.`;
    }
    
    window.open(`https://api.whatsapp.com/send?phone=${telefono}&text=${encodeURIComponent(msg)}`, '_blank');
}

function verDetalles(id) {
    const c = clientes.find(cli => cli.id === id);
    let html = `<h2>${c.nombre}</h2><p>Capital: $${f(c.capital)}</p><p>Pagado este mes: $${f(c.abonosMesActual)}</p><hr><h3>Historial</h3><table style="width:100%">`;
    c.historial.forEach(h => { html += `<tr><td>${h.fecha}</td><td>$${f(h.monto)}</td></tr>`; });
    html += `</table><br><button onclick="borrar(${c.id})" class="btn-borrar">BORRAR CLIENTE</button>`;
    document.getElementById('contenidoDetalle').innerHTML = html;
    document.getElementById('modalDetalles').style.display = "block";
}

function cerrarDetalles() { document.getElementById('modalDetalles').style.display = "none"; }
function guardarYRefrescar() { localStorage.setItem('cobro_master_data', JSON.stringify(clientes)); actualizarTodo(); }

function actualizarTodo() {
    const lista = document.getElementById('listaClientes');
    const buscador = document.getElementById('buscador').value.toLowerCase();
    lista.innerHTML = '';
    let globalFalta = 0;

    clientes.filter(c => c.nombre.toLowerCase().includes(buscador)).forEach(c => {
        const interes = c.capital * (c.tasa / 100);
        const pendiente = interes - c.abonosMesActual;
        if(pendiente > 0) globalFalta += pendiente;

        lista.innerHTML += `
            <div class="cliente-card">
                <h4 onclick="verDetalles(${c.id})">${c.nombre} 🔍</h4>
                <p>Deuda: <b>$${f(c.capital)}</b></p>
                <p>Lleva abonado: <b style="color:var(--primary)">$${f(c.abonosMesActual)}</b></p>
                <div class="botones">
                    <button class="btn-cobrar" onclick="cobrar('${c.nombre}','${c.telefono}',${c.capital},${c.tasa},${c.abonosMesActual})">📲 WhatsApp</button>
                    <button class="btn-pago" onclick="marcarPago(${c.id})">💵 Abonar</button>
                </div>
            </div>
        `;
    });
    document.getElementById('resumenCaja').innerText = `Pendiente este mes: $${f(globalFalta)}`;
}

function borrar(id) { if(confirm("¿Eliminar?")) { clientes = clientes.filter(c => c.id !== id); cerrarDetalles(); guardarYRefrescar(); } }
actualizarTodo();
