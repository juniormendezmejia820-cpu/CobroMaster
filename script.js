// Memoria: Carga los datos guardados al abrir la app
let clientes = JSON.parse(localStorage.getItem('cobro_master_data')) || [];

function agregarCliente() {
    const nombre = document.getElementById('nombre').value;
    const telefono = document.getElementById('telefono').value;
    const monto = parseFloat(document.getElementById('monto').value);
    const tasa = parseFloat(document.getElementById('tasaInteres').value);
    const fecha = document.getElementById('fechaPago').value;

    if(!nombre || isNaN(monto) || !fecha) {
        alert("¡Error! Llena Nombre, Capital y Fecha.");
        return;
    }

    const nuevo = { 
        id: Date.now(), 
        nombre, 
        telefono, 
        capital: monto, 
        tasa, 
        proximoPago: fecha 
    };

    clientes.push(nuevo);
    guardarYRefrescar();
    
    // Limpia los cuadros para el siguiente
    document.querySelectorAll('input').forEach(i => i.value = '');
    alert("✅ Guardado correctamente.");
}

function marcarPago(id) {
    const abono = parseFloat(prompt("¿Cuánto dinero entregó el cliente?"));
    if (isNaN(abono)) return;

    clientes = clientes.map(c => {
        if (c.id === id) {
            const interesMes = c.capital * (c.tasa / 100);
            const extra = abono - interesMes;

            if (extra > 0) {
                c.capital -= extra; // Abona al capital si sobra
                alert(`Interés de $${interesMes.toFixed(0)} cubierto.\nSe abonaron $${extra.toFixed(0)} al capital.\nNuevo saldo: $${c.capital.toFixed(0)}`);
            } else {
                alert(`Interés de $${interesMes.toFixed(0)} cobrado. El capital sigue igual.`);
            }

            // Mueve la fecha al mes siguiente
            let f = new Date(c.proximoPago + "T00:00:00");
            f.setMonth(f.getMonth() + 1);
            c.proximoPago = f.toISOString().split('T')[0];
        }
        return c;
    });
    guardarYRefrescar();
}

function cobrar(nombre, telefono, monto) {
    const msg = `Hola ${nombre}, paso a recordarte la cuota de hoy por $${monto.toLocaleString()}. Me confirmas por favor, gracias.`;
    window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(msg)}`);
}

function guardarYRefrescar() {
    localStorage.setItem('cobro_master_data', JSON.stringify(clientes));
    actualizarTodo();
}

function actualizarTodo() {
    const lista = document.getElementById('listaClientes');
    const buscador = document.getElementById('buscador').value.toLowerCase();
    const hoy = new Date().toISOString().split('T')[0];
    
    lista.innerHTML = '';
    let totalIntereses = 0;

    clientes.filter(c => c.nombre.toLowerCase().includes(buscador)).forEach(c => {
        const cuota = c.capital * (c.tasa / 100);
        const vencido = c.proximoPago <= hoy;
        totalIntereses += cuota;

        lista.innerHTML += `
            <div class="cliente-card ${vencido ? 'hoy' : ''}">
                <div style="display:flex; justify-content:space-between;">
                    <h4>${c.nombre}</h4>
                    <button onclick="borrar(${c.id})" style="background:none; border:none; color:gray;">🗑️</button>
                </div>
                <p>Capital: <strong>$${c.capital.toLocaleString()}</strong> (${c.tasa}%)</p>
                <p>Cuota Interés: <strong style="color:var(--primary)">$${cuota.toLocaleString()}</strong></p>
                <p>Fecha: <span class="${vencido ? 'alerta' : ''}">${c.proximoPago}</span></p>
                <div class="botones">
                    <a class="btn-cobrar" onclick="cobrar('${c.nombre}', '${c.telefono}', ${cuota})">📲 WhatsApp</a>
                    <button class="btn-pago" onclick="marcarPago(${c.id})">✅ Pago</button>
                </div>
            </div>
        `;
    });

    document.getElementById('resumenCaja').innerText = `Intereses por cobrar: $${totalIntereses.toLocaleString()}`;
}

function borrar(id) { if(confirm("¿Borrar deudor?")) { clientes = clientes.filter(c => c.id !== id); guardarYRefrescar(); } }

// Arranca la app mostrando lo que hay en memoria
actualizarTodo();
