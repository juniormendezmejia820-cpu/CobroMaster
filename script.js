let clientes = JSON.parse(localStorage.getItem('cobro_master_data')) || [];

// Función para poner puntos de mil
function format(n) {
    return new Number(n).toLocaleString('es-CO');
}

function agregarCliente() {
    const nombre = document.getElementById('nombre').value;
    let tel = document.getElementById('telefono').value.replace(/\D/g, '');
    const monto = parseFloat(document.getElementById('monto').value);
    const tasa = parseFloat(document.getElementById('tasaInteres').value);
    const fecha = document.getElementById('fechaPago').value;

    if(!nombre || isNaN(monto) || !fecha) { alert("Completa los datos básicos."); return; }
    if (tel.length === 10) tel = '57' + tel;

    clientes.push({ 
        id: Date.now(), nombre, telefono: tel, capital: monto, tasa, 
        proximoPago: fecha, historial: [], abonosMesActual: 0 
    });

    guardarYRefrescar();
    document.querySelectorAll('input').forEach(i => i.value = '');
}

function marcarPago(id) {
    const abono = parseFloat(prompt("¿Cuánto dinero abonó el cliente hoy?"));
    if (isNaN(abono) || abono <= 0) return;

    clientes = clientes.map(c => {
        if (c.id === id) {
            const interesMes = c.tasa > 0 ? (c.capital * (c.tasa / 100)) : 0;
            const fechaHoy = new Date().toLocaleDateString('es-CO');
            
            // Guardar en el historial de este usuario
            c.historial.push({ fecha: fechaHoy, monto: abono });
            c.abonosMesActual += abono;

            const faltaDeCuota = interesMes - c.abonosMesActual;

            if (faltaDeCuota <= 0) {
                // Si pagó todo el interés y sobró, va al capital
                const exceso = Math.abs(faltaDeCuota);
                if (exceso > 0) {
                    c.capital -= exceso;
                    alert(`✅ Cuota mensual lista.\n$${format(exceso)} abonados al capital.\nSaldo: $${format(c.capital)}`);
                } else {
                    alert(`✅ Cuota mensual pagada exacta.`);
                }
                
                c.abonosMesActual = 0; // Reinicia para el próximo mes
                let f = new Date(c.proximoPago + "T00:00:00");
                f.setMonth(f.getMonth() + 1);
                c.proximoPago = f.toISOString().split('T')[0];
            } else {
                alert(`💰 Abono recibido.\nFaltan $${format(faltaDeCuota)} para completar la cuota de este mes.`);
            }
        }
        return c;
    });
    guardarYRefrescar();
}

function verDetalles(id) {
    const c = clientes.find(cli => cli.id === id);
    const interesMes = c.capital * (c.tasa / 100);
    const falta = interesMes - c.abonosMesActual;

    let html = `
        <h2 style="color:var(--primary)">${c.nombre}</h2>
        <p><b>Capital:</b> $${format(c.capital)}</p>
        <p><b>WhatsApp:</b> ${c.telefono}</p>
        <p><b>Cuota total mes:</b> $${format(interesMes)}</p>
        <p><b>Pagado este mes:</b> $${format(c.abonosMesActual)}</p>
        <p><b>Pendiente mes:</b> $${format(falta > 0 ? falta : 0)}</p>
        <hr>
        <h3>Historial de Abonos</h3>
        <table style="width:100%; border-collapse:collapse;">
            <tr style="border-bottom:2px solid #444"><th>Fecha</th><th>Monto</th></tr>
    `;

    c.historial.forEach(h => {
        html += `<tr style="border-bottom:1px solid #333"><td>${h.fecha}</td><td>$${format(h.monto)}</td></tr>`;
    });

    html += `</table><br><button onclick="borrar(${c.id})" class="btn-borrar">ELIMINAR CLIENTE</button>`;
    
    document.getElementById('contenidoDetalle').innerHTML = html;
    document.getElementById('modalDetalles').style.display = "block";
}

function cerrarDetalles() { document.getElementById('modalDetalles').style.display = "none"; }

function guardarYRefrescar() {
    localStorage.setItem('cobro_master_data', JSON.stringify(clientes));
    actualizarTodo();
}

function actualizarTodo() {
    const lista = document.getElementById('listaClientes');
    const buscador = document.getElementById('buscador').value.toLowerCase();
    const hoy = new Date().toISOString().split('T')[0];
    lista.innerHTML = '';
    let globalFalta = 0;

    clientes.filter(c => c.nombre.toLowerCase().includes(buscador)).forEach(c => {
        const interes = c.capital * (c.tasa / 100);
        const pendiente = interes - c.abonosMesActual;
        globalFalta += (pendiente > 0 ? pendiente : 0);
        const vencido = c.proximoPago <= hoy;

        lista.innerHTML += `
            <div class="cliente-card ${vencido ? 'hoy' : ''}">
                <h4 onclick="verDetalles(${c.id})">${c.nombre} 🔍</h4>
                <p>Deuda: <b>$${format(c.capital)}</b></p>
                <p>Lleva abonado: <b style="color:var(--primary)">$${format(c.abonosMesActual)}</b></p>
                <p>Próximo cobro: ${c.proximoPago}</p>
                <div class="botones">
                    <button class="btn-pago" onclick="marcarPago(${c.id})">💵 Abonar</button>
                    <button class="btn-borrar" onclick="borrar(${c.id})" style="padding:10px">🗑️</button>
                </div>
            </div>
        `;
    });
    document.getElementById('resumenCaja').innerText = `Por cobrar este mes: $${format(globalFalta)}`;
}

function borrar(id) { 
    if(confirm("¿Seguro que quieres borrar a este cliente? Se perderá todo su historial.")) { 
        clientes = clientes.filter(c => c.id !== id); 
        cerrarDetalles();
        guardarYRefrescar(); 
    } 
}
actualizarTodo();
