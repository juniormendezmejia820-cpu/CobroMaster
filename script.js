let clientes = JSON.parse(localStorage.getItem('cobro_master_data')) || [];

// Función para poner puntos a los números
function f(num) {
    return new Number(num).toLocaleString('es-CO');
}

function agregarCliente() {
    const nombre = document.getElementById('nombre').value;
    let telefono = document.getElementById('telefono').value.replace(/\D/g, '');
    const monto = parseFloat(document.getElementById('monto').value);
    const tasa = parseFloat(document.getElementById('tasaInteres').value);
    const fecha = document.getElementById('fechaPago').value;

    if(!nombre || isNaN(monto) || !fecha) { alert("Llena los datos"); return; }
    if (telefono.length === 10) telefono = '57' + telefono;

    clientes.push({ 
        id: Date.now(), nombre, telefono, capital: monto, tasa, 
        proximoPago: fecha, historial: [], abonosMesActual: 0 
    });

    guardarYRefrescar();
    document.querySelectorAll('input').forEach(i => i.value = '');
}

function marcarPago(id) {
    const abono = parseFloat(prompt("¿Cuánto dinero entrega el cliente hoy?"));
    if (isNaN(abono) || abono <= 0) return;

    clientes = clientes.map(c => {
        if (c.id === id) {
            const interesTotal = c.tasa > 0 ? (c.capital * (c.tasa / 100)) : 0;
            const fechaHoy = new Date().toLocaleDateString();
            
            // Registrar en historial
            c.historial.push({ fecha: fechaHoy, monto: abono });
            c.abonosMesActual += abono;

            const faltanteInteres = interesTotal - c.abonosMesActual;

            if (faltanteInteres <= 0) {
                // Si cubrió el interés y sobró, abona al capital
                const sobraParaCapital = Math.abs(faltanteInteres);
                if (sobraParaCapital > 0) {
                    c.capital -= sobraParaCapital;
                    alert(`✅ ¡Cuota completada!\nSe abonaron $${f(sobraParaCapital)} al capital.\nSaldo: $${f(c.capital)}`);
                } else {
                    alert(`✅ ¡Cuota de interés pagada exactamente!`);
                }
                
                // Reiniciar abonos del mes y mover fecha
                c.abonosMesActual = 0;
                let f_pago = new Date(c.proximoPago + "T00:00:00");
                f_pago.setMonth(f_pago.getMonth() + 1);
                c.proximoPago = f_pago.toISOString().split('T')[0];
            } else {
                alert(`💰 Abono parcial registrado.\nFaltan $${f(faltanteInteres)} para completar la cuota del mes.`);
            }
        }
        return c;
    });
    guardarYRefrescar();
}

function verHistorial(id) {
    const c = clientes.find(cli => cli.id === id);
    document.getElementById('historialNombre').innerText = c.nombre;
    let html = `<table><tr><th>Fecha</th><th>Abono</th></tr>`;
    c.historial.forEach(h => {
        html += `<tr><td>${h.fecha}</td><td>$${f(h.monto)}</td></tr>`;
    });
    html += `</table><p><b>Abonado este mes: $${f(c.abonosMesActual)}</b></p>`;
    document.getElementById('contenidoHistorial').innerHTML = html;
    document.getElementById('modalHistorial').style.display = "block";
}

function cerrarHistorial() { document.getElementById('modalHistorial').style.display = "none"; }

function cobrar(nombre, telefono, capital, tasa, abonos) {
    const interes = capital * (tasa / 100);
    const pendiente = interes - abonos;
    const msg = `Hola ${nombre}, paso a recordarte el saldo de tu cuota. Llevas $${f(abonos)} y faltan $${f(pendiente)}. Quedo atento.`;
    window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(msg)}`);
}

function guardarYRefrescar() {
    localStorage.setItem('cobro_master_data', JSON.stringify(clientes));
    actualizarTodo();
}

function actualizarTodo() {
    const lista = document.getElementById('listaClientes');
    const buscador = document.getElementById('buscador').value.toLowerCase();
    lista.innerHTML = '';
    let globalInteres = 0;

    clientes.filter(c => c.nombre.toLowerCase().includes(buscador)).forEach(c => {
        const interes = c.capital * (c.tasa / 100);
        globalInteres += (interes - c.abonosMesActual);

        lista.innerHTML += `
            <div class="cliente-card">
                <h4 onclick="verHistorial(${c.id})">${c.nombre} 👁️</h4>
                <p>Capital: <b>$${f(c.capital)}</b></p>
                <p>Cuota Mes: <b>$${f(interes)}</b></p>
                <p>Lleva abonado: <b style="color:var(--primary)">$${f(c.abonosMesActual)}</b></p>
                <p>Cobro: ${c.proximoPago}</p>
                <div class="botones">
                    <button class="btn-cobrar" onclick="cobrar('${c.nombre}','${c.telefono}',${c.capital},${c.tasa},${c.abonosMesActual})">📲 WhatsApp</button>
                    <button class="btn-pago" onclick="marcarPago(${c.id})">💵 Abonar</button>
                </div>
            </div>
        `;
    });
    document.getElementById('resumenCaja').innerText = `Pendiente por cobrar: $${f(globalInteres)}`;
}

function borrar(id) { if(confirm("¿Eliminar?")) { clientes = clientes.filter(c => c.id !== id); guardarYRefrescar(); } }
actualizarTodo();
