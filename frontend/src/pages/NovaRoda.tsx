import { useForm } from 'react-hook-form';
import { IconeSeta } from '../components/icons';
import { NavInferior, StatusPill, TopbarMarca } from '../components/Layout';
import { db } from '../db';
import { fmtNum, parseNum } from '../format';
import { medidasAtuais } from '../services/usinagens';
import type { Medidas } from '../types';

export interface Rascunho {
  rodaId: string;
  medidas: Medidas;
}

interface FormValues {
  rodaId: string;
  diametro: string;
  aro: string;
  frisoEspessura: string;
  frisoAltura: string;
  anguloEixo: string;
}

const positivo = (rotulo: string) => ({
  required: `Informe ${rotulo}`,
  validate: (t: string) => {
    const n = parseNum(t);
    return (Number.isFinite(n) && n > 0) || 'Informe um número maior que zero';
  },
});

function paraForm(r?: Rascunho): FormValues {
  const f = (n?: number) => (n === undefined ? '' : fmtNum(n, 1));
  return {
    rodaId: r?.rodaId ?? '',
    diametro: f(r?.medidas.diametro),
    aro: f(r?.medidas.aro),
    frisoEspessura: f(r?.medidas.frisoEspessura),
    frisoAltura: f(r?.medidas.frisoAltura),
    anguloEixo: f(r?.medidas.anguloEixo),
  };
}

export function NovaRoda({ rascunho, onCalcular }: { rascunho?: Rascunho; onCalcular: (r: Rascunho) => void }) {
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: paraForm(rascunho) });

  /** Se o ID já existe, preenche as medidas com as atuais da roda (depois da última usinagem). */
  const preencherSeExistir = async () => {
    const id = getValues('rodaId').trim().toUpperCase();
    if (!id) return;
    const roda = await db.rodas.get(id);
    if (!roda) return;
    const m = medidasAtuais(roda, await db.usinagens.where('rodaId').equals(id).toArray());
    (Object.keys(m) as (keyof Medidas)[]).forEach((k) => setValue(k, fmtNum(m[k], 1)));
  };

  const onSubmit = (v: FormValues) =>
    onCalcular({
      rodaId: v.rodaId.trim().toUpperCase(),
      medidas: {
        diametro: parseNum(v.diametro),
        aro: parseNum(v.aro),
        frisoEspessura: parseNum(v.frisoEspessura),
        frisoAltura: parseNum(v.frisoAltura),
        anguloEixo: parseNum(v.anguloEixo),
      },
    });

  const campo = (id: keyof FormValues, rotulo: string, opcoes: object, mono = true) => (
    <div className="campo">
      <label htmlFor={id}>{rotulo}</label>
      <input
        id={id}
        type="text"
        inputMode={id === 'rodaId' ? 'text' : 'decimal'}
        autoComplete="off"
        className={mono ? 'mono' : ''}
        aria-invalid={!!errors[id]}
        aria-describedby={errors[id] ? `${id}-erro` : undefined}
        {...register(id, opcoes)}
        onBlur={id === 'rodaId' ? preencherSeExistir : undefined}
      />
      {errors[id] && (
        <p className="erro" id={`${id}-erro`}>
          {errors[id]?.message}
        </p>
      )}
    </div>
  );

  return (
    <div className="app">
      <TopbarMarca>
        <StatusPill />
      </TopbarMarca>

      <main className="conteudo">
        <div className="titulo-bloco">
          <h1>Nova roda</h1>
          <p>
            Informe a roda, as medidas atuais e o ângulo do eixo. O sistema indica o perfil que remove menos material.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="form-colunas">
          <section className="card">
            <h2 className="card-titulo">1 · Identificação</h2>
            {campo(
              'rodaId',
              'ID da roda',
              {
                required: 'Informe o ID da roda',
                pattern: { value: /^[A-Za-z0-9-]+$/, message: 'Use só letras, números e hífen' },
              },
              true,
            )}
          </section>

          <section className="card">
            <h2 className="card-titulo">2 · Medidas atuais</h2>
            <div className="grade-2">
              {campo('diametro', 'Diâmetro (mm)', positivo('o diâmetro'))}
              {campo('aro', 'Largura do aro (mm)', positivo('a largura do aro'))}
              {campo('frisoEspessura', 'Espessura do friso (mm)', positivo('a espessura do friso'))}
              {campo('frisoAltura', 'Altura do friso (mm)', positivo('a altura do friso'))}
            </div>
          </section>

          <section className="card">
            <h2 className="card-titulo">3 · Eixo</h2>
            {campo('anguloEixo', 'Ângulo do eixo (°)', {
              required: 'Informe o ângulo do eixo',
              validate: (t: string) => Number.isFinite(parseNum(t)) || 'Informe um número',
            })}
          </section>

          <button type="submit" className="btn-primario">
            Calcular perfil recomendado
            <IconeSeta />
          </button>
        </form>
      </main>

      <NavInferior ativa="nova" />
    </div>
  );
}
