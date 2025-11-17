const premiumState = {
  userId: null,
  subscription: null,
  plans: null,
  isLoading: false,
  isProcessingPayment: false,
  isPremium: false
};

// ============================================
// INICIALIZACIÓN
// ============================================
async function initializePremium() {
  premiumState.userId = getUserId();

  if (!premiumState.userId) {
    showAlert('Debes iniciar sesión para acceder a Premium', 'warning');
    setTimeout(() => {
      if (typeof loadPage === 'function') {
        loadPage('login');
      } else {
        window.location.href = '/app?page=login';
      }
    }, 1500);
    return;
  }

  // Verificar si venimos de un pago
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment_status');
  const collectionId = urlParams.get('collection_id');
  const paymentId = urlParams.get('payment_id');

  // Si hay parámetros de pago, procesarlos primero
  if (paymentStatus || collectionId || paymentId) {
    await procesarRetornoPago(urlParams);
  }

  // Cargar datos
  await Promise.all([
    cargarPlanes(),
    verificarEstadoPremium()
  ]);

  // Renderizar UI
  renderizarUI();

  // Setup event listeners
  setupPremiumEventListeners();
}

// ============================================
// PROCESAMIENTO DE PAGO
// ============================================
async function procesarRetornoPago(urlParams) {
  const paymentStatus = urlParams.get('payment_status');
  const collectionId = urlParams.get('collection_id');
  const collectionStatus = urlParams.get('collection_status');
  const paymentId = urlParams.get('payment_id');
  const externalReference = urlParams.get('external_reference');

  // console.log('📥 Procesando retorno de pago:', {
  //   paymentStatus,
  //   collectionId,
  //   collectionStatus,
  //   paymentId
  // });

  mostrarLoader(true);
  premiumState.isProcessingPayment = true;

  try {
    if (paymentStatus === 'success' || collectionStatus === 'approved' || collectionId || paymentId) {
      
      const params = new URLSearchParams();
      
      if (collectionId) {
        params.append('collection_id', collectionId);
      } else if (paymentId) {
        params.append('payment_id', paymentId);
      }
      
      if (collectionStatus) params.append('collection_status', collectionStatus);
      if (externalReference) params.append('external_reference', externalReference);

      showAlert('Verificando tu pago...', 'info');

      const response = await fetch(
        `${API_BASE_URL}/suscripciones/process-payment?${params.toString()}`,
        { method: 'GET' }
      );

      const result = await response.json();

      if (result.success) {
        showAlert('¡Pago exitoso! Ya eres Premium', 'success');
        
        // Actualizar usuario en storage
        actualizarUsuarioPremium(true);
        
        // Esperar para mostrar el mensaje
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Recargar para mostrar estado actualizado
        if (typeof loadPage === 'function') {
          loadPage('premium');
        } else {
          window.location.href = '/app?page=premium';
        }
        
      } else {
        showAlert(result.message || 'Hubo un problema al procesar tu pago', 'warning');
      }
      
    } else if (paymentStatus === 'pending') {
      showAlert('Tu pago está pendiente. Te notificaremos cuando se apruebe', 'info');
      
    } else if (paymentStatus === 'failure') {
      showAlert('El pago fue rechazado. Por favor intenta nuevamente', 'error');
    }
    
  } catch (error) {
    console.error('❌ Error procesando retorno de pago:', error);
    showAlert('Error al procesar el pago. Por favor contacta a soporte', 'error');
    
  } finally {
    mostrarLoader(false);
    premiumState.isProcessingPayment = false;
    
    // Limpiar URL
    limpiarURL();
  }
}

// ============================================
// CARGA DE DATOS
// ============================================
async function cargarPlanes() {
  try {
    const response = await fetch(`${API_BASE_URL}/suscripciones/plans`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    premiumState.plans = result.data;
  } catch (error) {
    console.error('❌ Error al cargar planes:', error);
    showAlert('Error al cargar planes', 'error');
  }
}

async function verificarEstadoPremium() {
  try {
    // Verificar si es premium (endpoint más ligero)
    const checkResponse = await fetch(`${API_BASE_URL}/suscripciones/${premiumState.userId}/check`);
    const checkResult = await checkResponse.json();
    
    premiumState.isPremium = checkResult.isPremium || false;

    // Si es premium, obtener detalles de la suscripción
    if (premiumState.isPremium) {
      const subResponse = await fetch(`${API_BASE_URL}/suscripciones/${premiumState.userId}`);
      const subResult = await subResponse.json();
      
      if (subResult.success && subResult.data) {
        premiumState.subscription = subResult.data;
      }
    }

  } catch (error) {
    console.error('❌ Error al verificar estado premium:', error);
  }
}

// ============================================
// CREAR SUSCRIPCIÓN
// ============================================
async function crearSuscripcion(planType) {
  if (premiumState.isLoading || premiumState.isProcessingPayment) {
    showAlert('Ya hay una operación en proceso', 'warning');
    return;
  }

  const plan = premiumState.plans[planType];
  if (!plan) {
    showAlert('Plan no encontrado', 'error');
    return;
  }

  const planName = plan.name;
  const planPrice = new Intl.NumberFormat('es-AR', { 
    style: 'currency', 
    currency: 'ARS' 
  }).format(plan.price);
  
  if (!confirm(`¿Confirmas la compra del plan ${planName} por ${planPrice}?`)) {
    return;
  }

  premiumState.isLoading = true;
  mostrarLoader(true);

  try {
    const response = await fetch(`${API_BASE_URL}/suscripciones/create-preference`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: premiumState.userId,
        planType
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    //console.log('✅ Preferencia creada:', result.data);

    const checkoutUrl = result.data.init_point || result.data.sandbox_init_point;

    if (!checkoutUrl) {
      throw new Error('No se pudo obtener la URL de pago');
    }

    sessionStorage.setItem('payment_in_progress', 'true');
    sessionStorage.setItem('payment_plan', planType);
    sessionStorage.setItem('payment_time', Date.now().toString());

    showAlert('Redirigiendo a Mercado Pago...', 'info');

    setTimeout(() => {
      window.location.href = checkoutUrl;
    }, 1000);

  } catch (error) {
    console.error('❌ Error al crear suscripción:', error);
    showAlert(error.message, 'error');
    mostrarLoader(false);
    premiumState.isLoading = false;
  }
}

// ============================================
// CANCELAR SUSCRIPCIÓN
// ============================================
async function cancelarSuscripcion() {
  if (!confirm(
    '¿Estás seguro de que deseas cancelar tu suscripción Premium?\n\n' +
    'Mantendrás el acceso hasta el final del período pagado.'
  )) {
    return;
  }

  try {
    mostrarLoader(true);

    const response = await fetch(
      `${API_BASE_URL}/suscripciones/${premiumState.userId}/cancel`,
      { method: 'POST' }
    );

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    showAlert(result.message, 'success');

    // Recargar estado
    await verificarEstadoPremium();
    renderizarUI();

  } catch (error) {
    console.error('❌ Error al cancelar suscripción:', error);
    showAlert(error.message, 'error');
    
  } finally {
    mostrarLoader(false);
  }
}

// ============================================
// UI - RENDERIZADO
// ============================================
function renderizarUI() {
  mostrarHeaderCorrecto();
  renderizarEstadoPremium();
  renderizarPlanes();
  setupFAQListeners();
}

function mostrarHeaderCorrecto() {
  const headerFree = document.getElementById('premiumHeaderFree');
  const headerActive = document.getElementById('premiumHeaderActive');

  if (headerFree && headerActive) {
    if (premiumState.isPremium) {
      headerFree.style.display = 'none';
      headerActive.style.display = 'block';
    } else {
      headerFree.style.display = 'block';
      headerActive.style.display = 'none';
    }
  }
}
function renderizarEstadoPremium() {
  const statusContainer = document.getElementById('premiumStatus');
  if (!statusContainer) return;

  if (!premiumState.isPremium || !premiumState.subscription) {
    statusContainer.style.display = 'none';
    return;
  }

  const sub = premiumState.subscription;

  const endDate = new Date(sub.endDate);
  const planName = sub.planType === 'monthly' ? 'Premium Mensual' : 'Premium Anual';

  document.getElementById('planName').textContent = planName;
  document.getElementById('validUntil').textContent =
    endDate.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

  const btnCancel = document.getElementById('btnCancelSubscription');

  if (sub.status === 'cancelled') {
    btnCancel.style.display = 'none';
  } else {
    btnCancel.style.display = 'block';
  }

  statusContainer.style.display = 'flex';
}


function renderizarPlanes() {
  const planCards = document.querySelectorAll('.plan-card');
  
  planCards.forEach(card => {
    const btn = card.querySelector('.btn-select-plan');
    if (!btn) return;

    const cardPlan = btn.dataset.plan;

    if (premiumState.isPremium && premiumState.subscription) {
      if (cardPlan === premiumState.subscription.planType && 
          premiumState.subscription.status === 'active') {
        btn.innerHTML = '<i class="fas fa-check"></i> Plan Actual';
        btn.disabled = true;
        btn.classList.add('btn-disabled');
        card.classList.add('plan-current');
      } else {
        btn.innerHTML = '<i class="fas fa-sync"></i> Cambiar a este Plan';
        btn.disabled = false;
        btn.classList.remove('btn-disabled');
        card.classList.remove('plan-current');
      }
    } else {
      btn.textContent = 'Seleccionar Plan';
      btn.disabled = false;
      btn.classList.remove('btn-disabled');
      card.classList.remove('plan-current');
    }
  });
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupPremiumEventListeners() {
  const btnSelectPlan = document.querySelectorAll('.btn-select-plan');
  
  btnSelectPlan.forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (!btn.disabled) {
        const planType = e.target.closest('.btn-select-plan').dataset.plan;
        crearSuscripcion(planType);
      }
    });
  });

  // Botón cancelar
  const btnCancel = document.getElementById('btnCancelSubscription');
  if (btnCancel) {
    btnCancel.addEventListener('click', cancelarSuscripcion);
  }
}

function setupFAQListeners() {
  const faqQuestions = document.querySelectorAll('.faq-question');
  
  faqQuestions.forEach(question => {
    // Remover listeners anteriores clonando el elemento
    const newQuestion = question.cloneNode(true);
    question.parentNode.replaceChild(newQuestion, question);
    
    newQuestion.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const faqItem = newQuestion.closest('.faq-item');
      const isActive = faqItem.classList.contains('active');

      // Cerrar todas las FAQs
      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
      });

      // Abrir la clickeada si no estaba activa
      if (!isActive) {
        faqItem.classList.add('active');
      }
    });
  });
}

// ============================================
// UTILIDADES
// ============================================
function getUserId() {
  const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId') || null;
  
  if (!userId) {
    console.error('❌ Usuario no logueado');
  }
  
  return userId;
}

function actualizarUsuarioPremium(isPremium) {
  const storageType = sessionStorage.getItem('userId') ? sessionStorage : localStorage;
  
  try {
    const userStr = storageType.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      user.premium = isPremium ? 1 : 0;
      storageType.setItem('user', JSON.stringify(user));
    }
  } catch (error) {
    console.error('❌ Error actualizando usuario:', error);
  }
}

function mostrarLoader(show) {
  const loader = document.getElementById('premiumLoader');
  if (loader) {
    loader.style.display = show ? 'flex' : 'none';
  }
}

function limpiarURL() {
  const cleanUrl = window.location.origin + window.location.pathname + '?page=premium';
  window.history.replaceState({}, document.title, cleanUrl);
}

// ============================================
// INICIALIZACIÓN
// ============================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePremium);
} else {
  initializePremium();
}