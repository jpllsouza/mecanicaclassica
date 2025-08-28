/* ===========================
   Utilidades / Constantes
=========================== */
const g = 9.80665;            // gravidade (m/s²)
const rho = 1.225;            // densidade ar (kg/m³) ~ nível do mar
const losses = { FWD: 0.15, RWD: 0.18, AWD: 0.22 }; // perdas típicas

// Parse de pneu: "LARGURA/ASPECTORaio", ex.: 205/55R16
function parseTire(spec){
  const m = String(spec||"").match(/(\d{3})\/(\d{2})R(\d{2})/i);
  if(!m) return null;
  const width = parseFloat(m[1]);       // mm
  const aspect = parseFloat(m[2]);      // %
  const rim = parseFloat(m[3]);         // polegadas
  const sidewall = width * (aspect/100);   // mm
  const rim_mm = rim * 25.4;               // mm
  const diameter_mm = rim_mm + 2*sidewall; // mm
  const diameter_m = diameter_mm/1000;
  const circumference_m = Math.PI * diameter_m;
  return {width, aspect, rim, diameter_m, circumference_m};
}

// Conversões
const kmh_to_ms = v => v/3.6;
const deg_to_rad = d => d*Math.PI/180;

/* ===========================
   Entrada dinâmica por objetivo
=========================== */
const inputsObjetivo = document.getElementById('inputs-objetivo');

document.querySelectorAll('input[name="goal"]').forEach(r => {
  r.addEventListener('change', updateGoalForm);
});
function updateGoalForm(){
  const val = document.querySelector('input[name="goal"]:checked')?.value;
  if(!val){ inputsObjetivo.innerHTML = ""; return; }

  if(val === 'vmax'){
    inputsObjetivo.innerHTML = `
      <h2>1.a) Objetivo — Velocidade Máxima</h2>
      <div class="grid">
        <label>Velocidade máxima desejada (km/h)
          <input type="number" id="vmax" placeholder="Ex.: 260" />
        </label>
      </div>
      <p class="note">Para Vmax, usaremos aerodinâmica + rolamento no regime estacionário.</p>
    `;
  }
  if(val === 'accel100' || val === 'accel200'){
    const vmax = (val==='accel100')?100:200;
    inputsObjetivo.innerHTML = `
      <h2>1.a) Objetivo — 0–${vmax} km/h</h2>
      <div class="grid">
        <label>Tempo desejado (s)
          <input type="number" id="t_acc" step="0.1" placeholder="Ex.: ${(val==='accel100')?7.0:20.0}" />
        </label>
      </div>
      <p class="note">O cálculo usa aceleração média (Δv/Δt) + resistências médias no intervalo.</p>
    `;
  }
  if(val === 'grade'){
    inputsObjetivo.innerHTML = `
      <h2>1.a) Objetivo — Rampa</h2>
      <div class="grid">
        <label>Inclinação da rampa (%)
          <input type="number" id="grade_pct" step="0.1" placeholder="Ex.: 12" />
        </label>
        <label>Velocidade alvo na rampa (km/h)
          <input type="number" id="v_grade" step="1" placeholder="Ex.: 60" />
        </label>
      </div>
      <p class="note">Força = peso·sen(θ) + rolamento + arrasto.</p>
    `;
  }
  if(val === 'towing'){
    inputsObjetivo.innerHTML = `
      <h2>1.a) Objetivo — Arrastar Carga</h2>
      <div class="grid">
        <label>Peso da carga (kg)
          <input type="number" id="cargo" step="1" placeholder="Ex.: 1200" />
        </label>
        <label>Coeficiente de resistência do reboque (Crr carga)
          <input type="number" id="crr_cargo" step="0.005" placeholder="Ex.: 0.02" />
        </label>
        <label>Velocidade alvo (km/h)
          <input type="number" id="v_tow" step="1" placeholder="Ex.: 80" />
        </label>
      </div>
      <p class="note">Inclui rolamento adicional da carga; arrasto aerodinâmico extra da carga não é considerado (pode ajustar Cd·A em “Veículo”).</p>
    `;
  }
  if(val === 'wheel_only'){
    inputsObjetivo.innerHTML = `
      <h2>1.a) Objetivo — Apenas potência/torque nas rodas</h2>
      <div class="grid">
        <label>Força ou potência desejada
          <select id="wheel_type">
            <option value="Pw">Potência na roda (kW)</option>
            <option value="Tw">Torque na roda (N·m)</option>
          </select>
        </label>
        <label>Valor
          <input type="number" id="wheel_value" step="0.1" placeholder="Ex.: 200 (kW) ou 3500 (N·m)" />
        </label>
      </div>
      <p class="note">Neste modo não pedimos pneus/transmissão e não convertemos para motor.</p>
    `;
  }
}
updateGoalForm(); // inicial

/* ===========================
   Botões
=========================== */
document.getElementById('btnLimpar').addEventListener('click', () => {
  location.reload();
});
document.getElementById('btnCalcular').addEventListener('click', calcular);

/* ===========================
   Núcleo de Cálculo
=========================== */
function calcular(){
  const goal = document.querySelector('input[name="goal"]:checked')?.value;
  if(!goal){ return show("Escolha um objetivo."); }

  // Dados do motor
  const bore = +document.getElementById('bore').value || 0;      // mm
  const stroke = +document.getElementById('stroke').value || 0;  // mm
  const cyl = +document.getElementById('cyl').value || 0;
  const valves = +document.getElementById('valves').value || 0;
  const rod = +document.getElementById('rod').value || 0;        // mm

  // Cálculos de motor básicos
  const D = bore/1000;   // m
  const C = stroke/1000; // m
  const Lb = rod/1000;   // m
  const Vd_total_cm3 = Math.PI*(D**2)/4 * C * cyl * 1e6; // cm³
  const Vd_L = Vd_total_cm3/1000;

  const RL = (C/2)/Lb; // razão r/l
  // Rotação alvo: depende do objetivo
  let rpm_peak = 6500; // base
  if(goal==='vmax') rpm_peak = 7000;
  if(goal==='accel100' || goal==='accel200' || goal==='towing' || goal==='grade') rpm_peak = 5500;

  // Checagem de velocidade média do pistão no uso alvo
  const Vp = 2*C*rpm_peak/60; // m/s
  const vp_limit = (goal==='vmax') ? 20 : 15;
  const vp_flag = Vp > vp_limit;

  // Se o objetivo for apenas rodas, não pedimos veículo/transmissão
  let needVeh = goal!=='wheel_only';

  // Dados do veículo
  const m = needVeh ? (+document.getElementById('mass').value || 0) : 0;
  const Cd = needVeh ? (+document.getElementById('cd').value || 0.3) : 0.3;
  const A = needVeh ? (+document.getElementById('area').value || 2.2) : 2.2;
  const Crr = needVeh ? (+document.getElementById('crr').value || 0.012) : 0.012;
  const tireSpec = needVeh ? document.getElementById('tire').value : "";
  const tire = needVeh ? parseTire(tireSpec) : null;

  // Transmissão
  const drivetrain = needVeh ? document.getElementById('drivetrain').value : 'FWD';
  const redline = needVeh ? (+document.getElementById('redline').value || rpm_peak) : rpm_peak;
  const loss = losses[drivetrain] ?? 0.18;
  const gearRatios = needVeh ? (document.getElementById('gearRatios').value || "")
                      .split(',')
                      .map(x => parseFloat(x.trim()))
                      .filter(x=>!Number.isNaN(x) && x>0) : [];
  const finalDrive = needVeh ? (+document.getElementById('finalDrive').value || 3.6) : 3.6;

  // Objetivo específico
  let result = [];
  result.push(`🔧 Deslocamento total: ${Vd_total_cm3.toFixed(0)} cm³ (${Vd_L.toFixed(2)} L)`);
  result.push(`🔧 R/L = ${RL.toFixed(3)} ${RL>0.3 ? badge('> 0,3 — atenção', 'danger'):''}`);
  result.push(`🔧 Rotação-alvo (pico de potência): ${rpm_peak.toFixed(0)} rpm ${vp_flag? badge(\`Vp ${Vp.toFixed(1)} m/s > ${vp_limit}\`, 'warn'):''}`);
  result.push(hr());

  if(goal==='wheel_only'){
    const kind = document.getElementById('wheel_type').value; // Pw/Tw
    const value = +document.getElementById('wheel_value').value;
    if(kind==='Pw'){
      result.push(`➡️ Potência na roda informada: ${value.toFixed(1)} kW`);
      // sem conversão para motor (regra do usuário)
    }else{
      result.push(`➡️ Torque na roda informado: ${value.toFixed(0)} N·m`);
    }
    // dimensionamentos com base em rpm_peak e potência alvo aproximada (se disponível)
    const Pw_kW = (kind==='Pw') ? value : null;
    applyHardwareSizing({result, Vd_L, cyl, rpm_peak, Pw_kW});
    return show(result.join('\n'));
  }

  // Verificações mínimas
  if(!tire){ result.push('⚠️ Especifique o pneu no formato 205/55R16.'); return show(result.join('\n')); }

  /* ====== Cálculos por objetivo ====== */
  if(goal==='vmax'){
    const V = kmh_to_ms(+document.getElementById('vmax').value || 0); // m/s
    // Resistências
    const Fd = 0.5 * rho * Cd * A * V*V;             // arrasto aerodinâmico
    const Frr = Crr * m * g;                          // rolamento ~ constante
    const Ftot = Fd + Frr;
    const Pw = Ftot * V / 1000; // kW na roda
    const Pengine = Pw/(1 - loss); // kW no motor
    const Tw = Ftot * (tire.circumference_m/(2*Math.PI)); // torque na roda (N·m) = F * raio
    const Teng = Tw / ( (gearRatios.slice(-1)[0]||1.0) * finalDrive * (1 - loss) ); // no topo (última marcha)

    result.push(`🎯 Vmáx: ${(+document.getElementById('vmax').value||0).toFixed(0)} km/h`);
    result.push(`• Potência necessária na roda: ${Pw.toFixed(1)} kW`);
    result.push(`• Potência no motor (com perdas ${Math.round(loss*100)}%): ${Pengine.toFixed(1)} kW`);
    result.push(`• Torque na roda na Vmáx: ${Tw.toFixed(0)} N·m`);
    result.push(`• Torque no motor na Vmáx (marcha topo): ${Teng.toFixed(0)} N·m`);
    // Relação necessária para atingir Vmáx em redline:
    const overall_needed = (V * 60) / (tire.circumference_m * redline); // rev roda/rev motor invertido
    // fórmula: redline rpm -> velocidade => overall = (wheel_rpm / engine_rpm) = (V/(circumf)*60)/redline
    // Relação total = marcha*dif = 1/overall_needed
    const total_ratio = 1/overall_needed;
    result.push(`• Relação total (marcha × diferencial) p/ atingir Vmáx no corte: ${total_ratio.toFixed(2)}:1`);
    if(gearRatios.length){
      const top = gearRatios.slice(-1)[0];
      const suggested_fd = total_ratio/top;
      result.push(`  ↳ Sugestão de diferencial usando última marcha (${top}): ${suggested_fd.toFixed(2)}:1`);
    }
    result.push(hr());
    // Dimensionamentos
    applyHardwareSizing({result, Vd_L, cyl, rpm_peak, Pw_kW:Pengine});
  }

  if(goal==='accel100' || goal==='accel200'){
    const vmax = (goal==='accel100')?100:200;
    const t = +document.getElementById('t_acc').value || ((goal==='accel100')?7.0:20.0);
    const V = kmh_to_ms(vmax);
    const a = V / t; // aceleração média
    // Aproximação: avaliar resistências na metade da velocidade
    const Vm = V/2;
    const Fd = 0.5 * rho * Cd * A * Vm*Vm;
    const Frr = Crr * m * g;
    const Faccel = m*a;
    const Ftot = Faccel + Frr + Fd;
    const Tw = Ftot * (tire.circumference_m/(2*Math.PI));
    const Pw = Ftot * Vm / 1000; // kW médio na roda durante o intervalo
    const Pengine = Pw/(1 - loss);
    const Teng = Tw / ( (gearRatios[0]||3.0) * finalDrive * (1 - loss) ); // 1ª marcha típica

    result.push(`🎯 0–${vmax} km/h em ${t.toFixed(1)} s`);
    result.push(`• Força média requerida: ${Ftot.toFixed(0)} N`);
    result.push(`• Torque médio na roda: ${Tw.toFixed(0)} N·m`);
    result.push(`• Potência média na roda: ${Pw.toFixed(1)} kW`);
    result.push(`• Potência no motor: ${Pengine.toFixed(1)} kW`);
    result.push(`• Torque no motor (1ª): ${Teng.toFixed(0)} N·m`);
    // Relação necessária para força no arranque:
    const required_overall = Tw / ( (Teng>0?Teng:1) ); // se o usuário quiser forçar torque-motor alvo, aqui ilustrativo
    if(gearRatios.length){
      const first = gearRatios[0];
      const suggested_fd = required_overall/first;
      result.push(`• Relação total alvo (torque): ${required_overall.toFixed(2)}:1`);
      result.push(`  ↳ Sugestão de diferencial com 1ª (${first}): ${suggested_fd.toFixed(2)}:1`);
    }
    result.push(hr());
    applyHardwareSizing({result, Vd_L, cyl, rpm_peak, Pw_kW:Pengine});
  }

  if(goal==='grade'){
    const grade_pct = +document.getElementById('grade_pct').value || 10;
    const V = kmh_to_ms(+document.getElementById('v_grade').value || 60);
    const theta = Math.atan(grade_pct/100);
    const Fgrade = m*g*Math.sin(theta);
    const Frr = Crr*m*g*Math.cos(theta);
    const Fd = 0.5 * rho * Cd * A * V*V;
    const Ftot = Fgrade + Frr + Fd;
    const Tw = Ftot * (tire.circumference_m/(2*Math.PI));
    const Pw = Ftot*V/1000;
    const Pengine = Pw/(1 - loss);
    const Teng = Tw / ( ((gearRatios[1]||2.0)) * finalDrive * (1 - loss) ); // 2ª marcha típica em subida

    result.push(`🎯 Subida ${grade_pct.toFixed(1)}% a ${(V*3.6).toFixed(0)} km/h`);
    result.push(`• Força total na roda: ${Ftot.toFixed(0)} N`);
    result.push(`• Torque na roda: ${Tw.toFixed(0)} N·m`);
    result.push(`• Potência na roda: ${Pw.toFixed(1)} kW`);
    result.push(`• Potência no motor: ${Pengine.toFixed(1)} kW`);
    result.push(`• Torque no motor (2ª): ${Teng.toFixed(0)} N·m`);
    // Relação sugerida para manter rpm útil
    if(gearRatios.length){
      const second = gearRatios[1]||gearRatios[0]||2.5;
      const wheel_rps = V / tire.circumference_m; // rev/s da roda
      const engine_rpm = wheel_rps * 60 * second * finalDrive;
      result.push(`• Estimativa de rpm em 2ª: ${engine_rpm.toFixed(0)} rpm`);
    }
    result.push(hr());
    applyHardwareSizing({result, Vd_L, cyl, rpm_peak, Pw_kW:Pengine});
  }

  if(goal==='towing'){
    const cargo = +document.getElementById('cargo').value || 0;
    const crr_c = +document.getElementById('crr_cargo').value || 0.02;
    const V = kmh_to_ms(+document.getElementById('v_tow').value || 80);
    const Frr = Crr*m*g + crr_c*cargo*g; // rolamento veículo + carga
    const Fd = 0.5 * rho * Cd * A * V*V;
    const Ftot = Frr + Fd;
    const Tw = Ftot * (tire.circumference_m/(2*Math.PI));
    const Pw = Ftot*V/1000;
    const Pengine = Pw/(1 - loss);
    const Teng = Tw / ( ((gearRatios[2]||1.4)) * finalDrive * (1 - loss) ); // 3ª típica p/ reboque moderado

    result.push(`🎯 Reboque de ${cargo.toFixed(0)} kg a ${(V*3.6).toFixed(0)} km/h`);
    result.push(`• Força total na roda: ${Ftot.toFixed(0)} N`);
    result.push(`• Torque na roda: ${Tw.toFixed(0)} N·m`);
    result.push(`• Potência na roda: ${Pw.toFixed(1)} kW`);
    result.push(`• Potência no motor: ${Pengine.toFixed(1)} kW`);
    result.push(`• Torque no motor (3ª): ${Teng.toFixed(0)} N·m`);
    if(gearRatios.length){
      const third = gearRatios[2]||gearRatios[1]||1.6;
      const wheel_rps = V / tire.circumference_m;
      const engine_rpm = wheel_rps * 60 * third * finalDrive;
      result.push(`• Estimativa de rpm em 3ª: ${engine_rpm.toFixed(0)} rpm`);
    }
    result.push(hr());
    applyHardwareSizing({result, Vd_L, cyl, rpm_peak, Pw_kW:Pengine});
  }

  show(result.join('\n'));
}

/* ===========================
   Dimensionamentos (admissão, TBI, escape, comando)
   Heurísticas de engenharia inspiradas em práticas comuns:
   - VE asp. ≈ 0.90 em pico; alvo velocidade ar admissão ≈ 100 m/s
   - Escape alvo ≈ 70 m/s
=========================== */
function applyHardwareSizing({result, Vd_L, cyl, rpm_peak, Pw_kW}){
  const VE = 0.90; // aspirado (ajuste conforme build)
  // Vazão volumétrica total no pico (m³/s)
  const Vd_m3 = Vd_L/1000; // m³
  const Q_total = (Vd_m3 * rpm_peak / 2) / 60 * VE; // 4T: um enchimento a cada 2 giros
  const Q_cyl = Q_total / cyl;

  // Admissão (vel. alvo ~100 m/s)
  const v_in = 100; // m/s
  const A_runner_total = Q_total / v_in;           // m²
  const A_runner_cyl = Q_cyl / v_in;               // m²
  const d_runner_total = Math.sqrt(4*A_runner_total/Math.PI); // m
  const d_runner_cyl = Math.sqrt(4*A_runner_cyl/Math.PI);     // m

  // Borboleta (TBI): ligeiramente maior que área total dos dutos
  const A_tbi = A_runner_total * 1.10;
  const d_tbi = Math.sqrt(4*A_tbi/Math.PI);

  // Escape (vel. alvo ~70 m/s)
  const v_ex = 70; // m/s
  const A_exh_total = Q_total / v_ex;
  const A_exh_cyl = Q_cyl / v_ex;
  const d_exh_total = Math.sqrt(4*A_exh_total/Math.PI);
  const d_exh_cyl = Math.sqrt(4*A_exh_cyl/Math.PI);

  result.push(`🧮 Vazão no pico (VE~0,90): ${(Q_total*1000).toFixed(1)} L/s (total) | por cilindro ${(Q_cyl*1000).toFixed(1)} L/s`);

  // Comando (faixa aproximada, @0.050" e LSA)
  const cam = suggestCamshaft(rpm_peak, Vd_L, cyl);
  result.push(`🦾 Comando sugerido (@0.050"): duração adm/esc ~ ${cam.durInt}/${cam.durExh}°, LSA ~ ${cam.lsa}° (faixa: ${cam.range})`);

  // Diâmetros (mm)
  result.push(`🌬️ Admissão (mín.): duto TOTAL ≈ ${(d_runner_total*1000).toFixed(1)} mm | por cil. ≈ ${(d_runner_cyl*1000).toFixed(1)} mm`);
  result.push(`🧈 Borboleta (TBI única eq.): ≈ ${(d_tbi*1000).toFixed(1)} mm`);
  result.push(`🔥 Escape (primários mín.): por cil. ≈ ${(d_exh_cyl*1000).toFixed(1)} mm (total eq.: ${(d_exh_total*1000).toFixed(1)} mm)`);
  // Torque específico e sobrealimentação
  if(Pw_kW && Pw_kW>0){
    // potência de motor alvo -> torque motor a rpm_peak
    const P_engine_kW = Pw_kW; // já é motor para nossas chamadas
    const T_engine_Nm = (P_engine_kW*1000) / (2*Math.PI*(rpm_peak/60));
    const T_per_L_kgfm = (T_engine_Nm/9.80665) / Vd_L; // kgfm por litro
    result.push(`🧭 Torque específico ~ ${T_per_L_kgfm.toFixed(2)} kgfm/L @ ${rpm_peak.toFixed(0)} rpm`);
    if(T_per_L_kgfm > 11.5){
      const PR = T_per_L_kgfm/11.5; // razão de pressão aproximada
      const boost_bar = (PR - 1);   // pressão relativa
      result.push(`⚠️ Excede 11,5 kgfm/L → considerar sobrealimentação ~ ${(boost_bar).toFixed(2)} bar (estimativa).`);
    }
  }
}

function suggestCamshaft(rpm, Vd_L, cyl){
  // Heurística simples por faixa de rpm de potência
  // street torque: 4500–5500 → ~212–224 @0.050", LSA 110–112
  // street/track: 6000–7000 → ~226–240 @0.050", LSA 108–110
  // race NA: 7500+ → 244–260 @0.050", LSA 106–108
  if(rpm < 5800) return { durInt: 218, durExh: 222, lsa: 111, range:"4500–5500 rpm" };
  if(rpm < 7200) return { durInt: 234, durExh: 238, lsa: 109, range:"6000–7000 rpm" };
  return { durInt: 250, durExh: 254, lsa: 107, range:"7500+ rpm" };
}

/* ===========================
   Helpers de saída
=========================== */
function badge(txt, kind='warn'){ return ` <span class="badge ${kind}">${txt}</span>`; }
function hr(){ return '————————————————————————————'; }
function show(txt){ document.getElementById('out').textContent = txt; }
