// -----------------------------------------
// Klaviyo newsletter signup
// Intercepts the Webflow form and POSTs to Klaviyo Client API
// Passes locale (en/de) as a custom property for language segmentation
// -----------------------------------------

const KLAVIYO_COMPANY_ID = 'Wv8r4P';
const KLAVIYO_LIST_ID = 'SyFSz3';

function getLocale() {
  const path = window.location.pathname;
  if (path.startsWith('/de/') || path === '/de') return 'de';
  return 'en';
}

export function initKlaviyo() {
  const form = document.querySelector('.klaviyo-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const emailInput = form.querySelector('.klaviyo-form__email');
    const submitBtn = form.querySelector('[type="submit"]');
    const formBlock = form.closest('.klaviyo-form__block');
    const successEl = formBlock?.querySelector('.w-form-done');
    const errorEl = formBlock?.querySelector('.w-form-fail');

    const email = emailInput?.value?.trim();
    if (!email) return;

    const originalValue = submitBtn?.value;
    if (submitBtn) {
      submitBtn.value = submitBtn.dataset.wait || 'Please wait...';
      submitBtn.disabled = true;
    }

    try {
      const res = await fetch(`https://a.klaviyo.com/client/subscriptions?company_id=${KLAVIYO_COMPANY_ID}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/vnd.api+json',
          'revision': '2024-10-15',
        },
        body: JSON.stringify({
          data: {
            type: 'subscription',
            attributes: {
              custom_source: 'Website Signup',
              profile: {
                data: {
                  type: 'profile',
                  attributes: {
                    email,
                    properties: { language: getLocale() },
                  },
                },
              },
            },
            relationships: {
              list: {
                data: { type: 'list', id: KLAVIYO_LIST_ID },
              },
            },
          },
        }),
      });

      if (res.ok || res.status === 202) {
        form.style.display = 'none';
        if (successEl) successEl.style.display = 'block';
      } else {
        throw new Error(`Klaviyo responded ${res.status}`);
      }
    } catch (err) {
      console.error('Klaviyo signup error:', err);
      if (errorEl) errorEl.style.display = 'block';
    } finally {
      if (submitBtn) {
        submitBtn.value = originalValue;
        submitBtn.disabled = false;
      }
    }
  });
}
