let clientes = JSON.parse(localStorage.getItem('cobro_master_data')) || [];

function agregarCliente() {
    const nombre = document.getElementById('nombre').value;
    const cedula = document.getElementById('cedula').value;
    const telefono = document.getElementById('telefono').value;
    const monto = parseFloat(document.getElementById('monto').value);
    const tasa = parseFloat(document.getElementById('tasaInteres').value);
    const fecha = document.getElementById('fechaPago').value;

    if(!nombre || isNaN(monto) || !fecha) {
        alert("Llena los datos básicos (Nombre, Monto y Fecha).");
        return;
    }

    clientes.push({ 
        id: Date.now(), 
        nombre, 
        cedula, 
        telefono, 
        capital: monto, 
        tasa: tasa, 
        proximoPago: fecha 
    });

    actualizarTodo();
    limpiarCampos();
    alert("✅ Registrado con éxito.");
}

function marcarPago(id) {
    const abono = parseFloat(prompt("¿Cuánto dinero entregó el cliente?"));
    if (isNaN(abono)) return;

    clientes = clientes.map(c => {
        if (c.id === id) {
            const interesMes = c.capital * (c.tasa / 100);
            const diferencia = abono - interesMes;

            if (diferencia > 0) {
                // Ejemplo Deiron: Dio 120k, interés era 100k -> abona 20k al capital
                c.capital -= diferencia;
                alert(`Pago exitoso:\n- Interés cubierto: $${interesMes.toFixed(0)}\n- Abono a capital: $${diferencia.toFixed(0)}\n- Nuevo Capital: $${c.capital.toFixed(0)}`);
            } else if (diferencia === 0) {
                alert(`Pago exacto del interés ($${interesMes.toFixed(0)}). El capital sigue igual.`);
            } else {
                alert(`Atención: El pago no cubre el interés total. Le faltaron $${Math.abs(diferencia).toFixed(0)} para cubrir solo el interés.`);
            }

            // Mover la fecha al próximo mes automáticamente
            let f = new Date(c.proximoPago + "T00:00:00");
            f.setMonth(f.getMonth() + 1);
            c.proximoPago = f.toISOString().split('T')[0];
        }
        return c;
    });
    actualizarTodo();
}

function cobrar(nombre, telefono, montoInteres) {
    const msg = `Hola ${nombre}, te escribo para recordarte el pago de la cuota de hoy por $${montoInteres.toFixed(0)}. Quedo atento, gracias.`;
    window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(msg)}`);
}

function actualizarTodo() {
    localStorage.setItem('cobro_master_data', JSON.stringify(clientes));
    const lista = document.getElementById('listaClientes');
    const buscador = document.getElementById('buscador').value.toLowerCase();
    const hoy = new Date().toISOString().split('T')[0];
    
    lista.innerHTML = '';
    let totalInteresesMes = 0;

    clientes.filter(c => c.nombre.toLowerCase().includes(buscador)).forEach(c => {
        const interesActual = c.capital * (c.tasa / 100);
        const esVencido = c.proximoPago <= hoy;
        totalInteresesMes += interesActual;

        lista.innerHTML += `
            <div class="cliente-card ${esVencido ? 'hoy' : ''}">
                <div style="display:flex; justify-content:space-between;">
                    <h4>${c.nombre} <span class="badge">${c.tasa}%</span></h4>
                    <button onclick="borrar(${c.id})" class="btn-borrar">🗑️</button>
                </div>
                <p>Capital: <strong>$${c.capital.toLocaleString()}</strong></p>
                <p>Cuota Interés: <strong style="color:var(--primary)">$${interesActual.toLocaleString()}</strong></p>
                <p>Próximo Cobro: <span class="${esVencido ? 'alerta' : ''}">${c.proximoPago}</span></p>
                <div class="botones">
                    <button class="btn-cobrar" onclick="cobrar('${c.nombre}', '${c.telefono}', ${interesActual})">📲 WhatsApp</button>
                    <button class="btn-pago" onclick="marcarPago(${c.id})">✅ Registrar Pago</button>
                </div>
            </div>
        `;
    });

    document.getElementById('resumenCaja').innerText = `Proyección intereses total: $${totalInteresesMes.toLocaleString()}`;
}

function borrar(id) { if(confirm("¿Eliminar registro?")) { clientes = clientes.filter(c => c.id !== id); actualizarTodo(); } }
function limpiarCampos() { document.querySelectorAll('input').forEach(i => i.value = ''); }
actualizarTodo();