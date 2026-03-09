import React, { useMemo, useState } from 'react'
import './style.css'

type PaymentMethod = 'efectivo' | 'cheque' | 'vales' | 'tarjeta'
type AmountMap = Record<PaymentMethod, number>
type AmountInputs = Record<PaymentMethod, string>

type PaymentRow = {
  key: PaymentMethod
  label: string
}

const paymentRows: PaymentRow[] = [
  { key: 'efectivo', label: 'Efectivo' },
  { key: 'cheque', label: 'Cheque' },
  { key: 'vales', label: 'Vales' },
  { key: 'tarjeta', label: 'Tarjeta' },
]

const initialCalculated: AmountMap = {
  efectivo: 2066.5,
  cheque: 0,
  vales: 0,
  tarjeta: 1233,
}

const initialEditable: AmountInputs = {
  efectivo: '0.00',
  cheque: '0.00',
  vales: '0.00',
  tarjeta: '0.00',
}

const additionalInfo = [
  { id: 'transferencias', label: 'Total Transferencias', value: 0 },
  { id: 'anticipos', label: 'Total Anticipos', value: 0 },
  { id: 'sicar-pagos', label: 'Total SICAR Pagos', value: 0 },
]

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const parseMoney = (value: string): number => {
  const trimmedValue = value.trim()
  if (trimmedValue === '') {
    return 0
  }

  let normalized = trimmedValue.replace(/[^\d,.-]/g, '')
  const lastComma = normalized.lastIndexOf(',')
  const lastDot = normalized.lastIndexOf('.')

  if (lastComma > lastDot) {
    normalized = normalized.replace(/\./g, '').replace(',', '.')
  } else {
    normalized = normalized.replace(/,/g, '')
  }

  const parsedValue = Number.parseFloat(normalized)
  return Number.isFinite(parsedValue) ? parsedValue : 0
}

const toAmountMap = (inputValues: AmountInputs): AmountMap => {
  return paymentRows.reduce(
    (accumulator, row) => {
      accumulator[row.key] = parseMoney(inputValues[row.key])
      return accumulator
    },
    { efectivo: 0, cheque: 0, vales: 0, tarjeta: 0 } as AmountMap
  )
}

const sumAmounts = (values: AmountMap): number => {
  return paymentRows.reduce((accumulator, row) => accumulator + values[row.key], 0)
}

const formatCurrency = (value: number): string => currencyFormatter.format(value)

const differenceClassName = (value: number): string => {
  if (value < 0) {
    return 'corte-caja__money corte-caja__money--negative'
  }

  if (value > 0) {
    return 'corte-caja__money corte-caja__money--positive'
  }

  return 'corte-caja__money corte-caja__money--neutral'
}

export const CorteCaja = () => {
  const [contadoInputs, setContadoInputs] = useState<AmountInputs>(initialEditable)
  const [retiroInputs, setRetiroInputs] = useState<AmountInputs>(initialEditable)

  const contadoValues = useMemo(() => toAmountMap(contadoInputs), [contadoInputs])
  const retiroValues = useMemo(() => toAmountMap(retiroInputs), [retiroInputs])

  const differenceValues = useMemo<AmountMap>(() => {
    return paymentRows.reduce(
      (accumulator, row) => {
        accumulator[row.key] = contadoValues[row.key] - initialCalculated[row.key]
        return accumulator
      },
      { efectivo: 0, cheque: 0, vales: 0, tarjeta: 0 } as AmountMap
    )
  }, [contadoValues])

  const totalContado = sumAmounts(contadoValues)
  const totalCalculado = sumAmounts(initialCalculated)
  const totalDiferencia = sumAmounts(differenceValues)
  const totalRetiro = sumAmounts(retiroValues)

  const handleInputChange = (
    fieldType: 'contado' | 'retiro',
    method: PaymentMethod,
    value: string
  ) => {
    if (fieldType === 'contado') {
      setContadoInputs((currentValues) => ({
        ...currentValues,
        [method]: value,
      }))
      return
    }

    setRetiroInputs((currentValues) => ({
      ...currentValues,
      [method]: value,
    }))
  }

  const handleInputBlur = (fieldType: 'contado' | 'retiro', method: PaymentMethod) => {
    if (fieldType === 'contado') {
      setContadoInputs((currentValues) => ({
        ...currentValues,
        [method]: parseMoney(currentValues[method]).toFixed(2),
      }))
      return
    }

    setRetiroInputs((currentValues) => ({
      ...currentValues,
      [method]: parseMoney(currentValues[method]).toFixed(2),
    }))
  }

  return (
    <section className='corte-caja'>
      <header className='corte-caja__header'>
        <div>
          <h1 className='corte-caja__title'>Información del Corte de Caja</h1>
          <p className='corte-caja__subtitle'>Caja: MOLEKINHA</p>
        </div>
        <button type='button' className='corte-caja__save-button'>
          <span className='corte-caja__save-icon' aria-hidden='true'>
            💾
          </span>
          Guardar
        </button>
      </header>

      <div className='corte-caja__main'>
        <article className='corte-caja__panel corte-caja__panel--comparison'>
          <div className='corte-caja__panel-head'>
            <h2 className='corte-caja__panel-title'>Comparativo de Efectivo</h2>
          </div>

          <div className='corte-caja__table-scroll'>
            <div className='corte-caja__comparison-table' role='table' aria-label='Tabla comparativa de corte de caja'>
              <div className='corte-caja__comparison-header' role='row'>
                <div className='corte-caja__comparison-header-cell corte-caja__comparison-header-cell--method' />
                <div className='corte-caja__comparison-header-cell'>Contado</div>
                <div className='corte-caja__comparison-header-cell'>Calculado</div>
                <div className='corte-caja__comparison-header-cell'>Diferencia</div>
              </div>

              {paymentRows.map((row) => (
                <div className='corte-caja__comparison-row' role='row' key={row.key}>
                  <div className='corte-caja__comparison-label-wrap'>
                    <label className='corte-caja__label' htmlFor={`contado-${row.key}`}>
                      {row.label}
                    </label>
                    {row.key === 'efectivo' ? (
                      <button
                        type='button'
                        className='corte-caja__aux-button'
                        aria-label='Acción auxiliar para efectivo'
                      >
                        🧾
                      </button>
                    ) : null}
                  </div>

                  <input
                    id={`contado-${row.key}`}
                    className='corte-caja__input'
                    type='text'
                    inputMode='decimal'
                    value={contadoInputs[row.key]}
                    onChange={(event) => handleInputChange('contado', row.key, event.target.value)}
                    onBlur={() => handleInputBlur('contado', row.key)}
                  />

                  <input
                    className='corte-caja__input corte-caja__input--readonly'
                    type='text'
                    value={formatCurrency(initialCalculated[row.key])}
                    readOnly
                  />

                  <input
                    className={`corte-caja__input corte-caja__input--readonly ${differenceClassName(
                      differenceValues[row.key]
                    )}`}
                    type='text'
                    value={formatCurrency(differenceValues[row.key])}
                    readOnly
                  />
                </div>
              ))}

              <div className='corte-caja__comparison-row corte-caja__comparison-row--total' role='row'>
                <strong className='corte-caja__label corte-caja__label--total'>Total</strong>
                <input className='corte-caja__input corte-caja__input--readonly' type='text' value={formatCurrency(totalContado)} readOnly />
                <input
                  className='corte-caja__input corte-caja__input--readonly'
                  type='text'
                  value={formatCurrency(totalCalculado)}
                  readOnly
                />
                <input
                  className={`corte-caja__input corte-caja__input--readonly ${differenceClassName(totalDiferencia)}`}
                  type='text'
                  value={formatCurrency(totalDiferencia)}
                  readOnly
                />
              </div>
            </div>
          </div>
        </article>

        <aside className='corte-caja__panel corte-caja__panel--withdraw'>
          <div className='corte-caja__panel-head'>
            <h2 className='corte-caja__panel-title'>Retiro por Corte</h2>
          </div>

          <div className='corte-caja__withdraw-grid'>
            {paymentRows.map((row) => (
              <div className='corte-caja__withdraw-row' key={row.key}>
                <label className='corte-caja__label' htmlFor={`retiro-${row.key}`}>
                  {row.label}
                </label>
                <div className='corte-caja__withdraw-controls'>
                  {row.key === 'efectivo' ? (
                    <button
                      type='button'
                      className='corte-caja__aux-button'
                      aria-label='Acción auxiliar para retiro en efectivo'
                    >
                      🧾
                    </button>
                  ) : (
                    <span className='corte-caja__aux-placeholder' aria-hidden='true' />
                  )}
                  <input
                    id={`retiro-${row.key}`}
                    className='corte-caja__input'
                    type='text'
                    inputMode='decimal'
                    value={retiroInputs[row.key]}
                    onChange={(event) => handleInputChange('retiro', row.key, event.target.value)}
                    onBlur={() => handleInputBlur('retiro', row.key)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className='corte-caja__withdraw-total'>
            <strong className='corte-caja__label corte-caja__label--total'>Total</strong>
            <input
              className='corte-caja__input corte-caja__input--readonly'
              type='text'
              value={formatCurrency(totalRetiro)}
              readOnly
            />
          </div>
        </aside>
      </div>

      <section className='corte-caja__panel corte-caja__panel--additional'>
        <div className='corte-caja__panel-head'>
          <h2 className='corte-caja__panel-title'>Información Adicional</h2>
        </div>

        <div className='corte-caja__additional-grid'>
          {additionalInfo.map((item) => (
            <div className='corte-caja__additional-item' key={item.id}>
              <span className='corte-caja__additional-label'>{item.label}</span>
              <strong className='corte-caja__additional-value'>{formatCurrency(item.value)}</strong>
            </div>
          ))}
        </div>

        <p className='corte-caja__note'>
          El total de transferencias también se ven reflejados en los totales del corte de caja
        </p>
      </section>

    </section>
  )
}
