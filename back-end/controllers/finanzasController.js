import Finanzas from '../models/Finanzas.js';

export const getResumenFinanciero = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let matchStage = {};

    if (startDate && endDate) {
      matchStage.fecha = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const transacciones = await Finanzas.find(matchStage);

    let totalIngresos = 0;
    let totalEgresos = 0;
    let saldoPorCuenta = {};

    transacciones.forEach(t => {
      // Calculamos ingresos y egresos
      if (t.tipoTransaccion === 'Ingreso') {
        totalIngresos += t.monto;
        
        // Sumamos a la cuenta destino
        if (!saldoPorCuenta[t.cuenta]) saldoPorCuenta[t.cuenta] = 0;
        saldoPorCuenta[t.cuenta] += t.monto;

      } else if (t.tipoTransaccion === 'Egreso') {
        totalEgresos += t.monto;

        // Restamos de la cuenta origen
        if (!saldoPorCuenta[t.cuenta]) saldoPorCuenta[t.cuenta] = 0;
        saldoPorCuenta[t.cuenta] -= t.monto;

      } else if (t.tipoTransaccion === 'Transferencia') {
        // En transferencia, restamos de cuentaOrigen y sumamos a cuentaDestino (cuenta)
        if (t.cuentaOrigen) {
          if (!saldoPorCuenta[t.cuentaOrigen]) saldoPorCuenta[t.cuentaOrigen] = 0;
          saldoPorCuenta[t.cuentaOrigen] -= t.monto;
        }
        if (t.cuenta) {
          if (!saldoPorCuenta[t.cuenta]) saldoPorCuenta[t.cuenta] = 0;
          saldoPorCuenta[t.cuenta] += t.monto;
        }
      }
    });

    const balanceGeneral = totalIngresos - totalEgresos;

    res.json({
      ingresos: totalIngresos,
      egresos: totalEgresos,
      balance: balanceGeneral,
      saldos: saldoPorCuenta
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
