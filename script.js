let clientes = JSON.parse(localStorage.getItem('cobro_master_data')) || [];

function agregarCliente() {
    const nombre = document.getElementById('nombre').value;
    let telefono = document.getElementById('telefono').value;
    const monto = parseFloat(document.getElementById('monto').value);
    const tasa = parseFloat(document.getElementById('tasaInteres').value);
    const fecha = document.getElementById('fechaPago').value;

    if(!nombre || isNaN(monto) || !fecha) {
        alert("¡Error! Llena Nombre, Capital y Fecha.");
        return;
    }

    // LIMPIEZA DE NÚMERO: Quita espacios, símbolos y asegura el código de país
    telefono = telefono.replace(/\D/g, ''); // Deja solo números
    if (telefono.length === 10) telefono = '57' + telefono; // Si pones 10 dígitos, le pone el 57 de Colombia

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
    document.querySelectorAll('input').forEach(i => i.value = '');
    alert("✅ Guardado correctamente.");
}

function marcarPago(id) {
    const abono = parseFloat(prompt("¿Cuánto dinero entregó el cliente?"));
    if (isNaN(abono)) return;

    clientes = clientes.map(c => {
        if (c.id === id) {
            const interesMes = c.tasa > 0 ? (c.capital * (c.tasa / 100)) : 0;
            const diferencia = abono - interesMes;

            if (diferencia > 0) {
                c.capital -= diferencia;
                alert(`Pago: $${abono.toLocaleString()}\nInterés: $${interesMes.toFixed(0)}\nAbono a capital: $${diferencia.toFixed(0)}\nNuevo Saldo: $${c.capital.toFixed(0)}`);
            } else if (diferencia === 0 && c.tasa > 0) {
                alert(`Pago exacto del interés ($${interesMes.toFixed(0)}).`);
            } else {
                alert(`No cubre el interés. Faltan $${Math.abs(diferencia).toFixed(0)}`);
            }

            let f = new Date(c.proximoPago + "T00:00:00");
            f.setMonth(f.getMonth() + 1);
            c.proximoPago = f.toISOString().split('T')[0];
        }
        return c;
    });
    guardarYRefrescar();
}

function cobrar(nombre, telefono, monto, tasa) {
    const textoCuota = tasa > 0 ? `la cuota de intereses por $${monto.toLocaleString()}` : `el abono a tu deuda`;
    const msg = `Hola ${nombre}, paso a recordarte ${textoCuota}. Quedo atento, gracias.`;
    
    // Enlace directo sin errores
    const url = `https://api.whatsapp.com/send?phone=${telefono}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
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
        if (c.tasa > 0) totalIntereses += cuota;

        lista.innerHTML += `
            <div class="cliente-card ${vencido ? 'hoy' : ''}">
                <div style="display:flex; justify-content:space-between;">
                    <h4>${c.nombre} ${c.tasa == 0 ? '<span class="badge">S.I.</span>' : ''}</h4>
                    <button onclick="borrar(${c.id})" style="background:none; border:none; color:gray;">🗑️</button>
                </div>
                <p>Deuda: <strong>$${c.capital.toLocaleString()}</strong></p>
                ${c.tasa > 0 ? `<p>Interés: <strong style="color:var(--primary)">$${cuota.toLocaleString()}</strong></p>` : '<p style="color:var(--primary)">Sin intereses</p>'}
                <p>Cobro: <span class="${vencido ? 'alerta' : ''}">${c.proximoPago}</span></p>
                <div class="botones">
                    <button class="btn-cobrar" onclick="cobrar('${c.nombre}', '${c.telefono}', ${cuota}, ${c.tasa})">📲 WhatsApp</button>
                    <button class="btn-pago" onclick="marcarPago(${c.id})">✅ Pago</button>
                </div>
            </div>
        `;
    });

    document.getElementById('resumenCaja').innerText = `Total intereses del mes: $${totalIntereses.toLocaleString()}`;
}

function borrar(id) { if(confirm("¿Borrar deudor?")) { clientes = clientes.filter(c => c.id !== id); guardarYRefrescar(); } }

actualizarTodo();
