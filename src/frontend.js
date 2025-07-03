/**
 * Marketo Form Block - Frontend JavaScript
 *
 * @package Marketo_Form_Block
 */

// Initialize when jQuery is ready
jQuery(document).ready(function ($) {
  // Check for global marketo configuration
  if (typeof marketo === 'undefined') {
    displayError('Marketo configuration not found. Please check your settings.');
    return;
  }
  
  // Check if Marketo Forms API is loaded
  if (typeof MktoForms2 === 'undefined') {
    displayError('Marketo Forms API not loaded. Please check if the script is being blocked by your browser.');
    return;
  }
  
  // Initialize Marketo forms
  var MKTOFORM_ID_ATTRNAME = "data-id";
  var mktoFormConfig = {
    podId: marketo.url,
    munchkinId: marketo.api,
    formIds: Array.prototype.slice
      .call(document.querySelectorAll(".mktoForm"))
      .map((a) => a.getAttribute(MKTOFORM_ID_ATTRNAME)),
  };

  function mktoFormChain(config) {
    var arrayFrom = Function.prototype.call.bind(Array.prototype.slice);

    /* fix inter-form label bug! */
    MktoForms2.whenRendered(function (form) {
      form.getFormElem().removeAttr("style");

      document.querySelectorAll(".mktoHasWidth").forEach(function (el) {
        el.removeAttribute("style");
      });

      var formEl = form.getFormElem()[0],
        rando = "_" + new Date().getTime() + Math.random();

      Array.prototype.slice
        .call(
          document.querySelectorAll(
            "#mktoForms2ThemeStyle, #mktoForms2BaseStyle, .mktoAsterix, .mktoOffset, .mktoGutter, .mktoClear"
          )
        )
        .forEach(function (el) {
          el.parentNode.removeChild(el);
        });

      arrayFrom(formEl.querySelectorAll("label[for]")).forEach(function (
        labelEl
      ) {
        var forEl = formEl.querySelector('[id="' + labelEl.htmlFor + '"]');
        if (forEl) {
          labelEl.htmlFor = forEl.id = forEl.id + rando;
        }
      });

      if (document.querySelector(".mktoRadioList")) {
        document
          .querySelector(".mktoRadioList")
          .parentElement.parentElement.classList.add("radio-list-fix");
      }

      Array.prototype.slice
        .call(document.querySelectorAll(".mktoField"))
        .forEach(function (el) {
          el.addEventListener("focus", (event) => {
            event.target.parentElement.parentElement.classList.add(
              "form-field--is-active"
            );
          });

          el.addEventListener("blur", (event) => {
            event.target.parentElement.parentElement.classList.remove(
              "form-field--is-active"
            );
            if (event.target.value === "") {
              event.target.parentElement.parentElement.classList.remove(
                "form-field--is-filled"
              );
            } else {
              event.target.parentElement.parentElement.classList.add(
                "form-field--is-filled"
              );
            }
          });
        });
    });

    MktoForms2.whenReady(function (form) {
      var formEl = form.getFormElem()[0];

      form.onValidate(function (builtInValidation) {
        if (!builtInValidation) return;
        form.submittable(true);
      });

      form.onSuccess(function (values, followUpUrl) {
        
        // Dispatch custom success event
        dispatchFormSuccessEvent(values, formEl.getAttribute(MKTOFORM_ID_ATTRNAME));
        
        if (formEl.getAttribute("data-confirmation-type") === "message") {
          form.getFormElem().hide();
          form.getFormElem()[0].nextElementSibling.style.display = "block";
        }

        if (formEl.getAttribute("data-confirmation-type") === "redirect") {
          location.href = formEl.getAttribute("data-link");
        }

        return false;
      });
    });

    /* chain, ensuring only one #mktoForm_nnn exists at a time */
    arrayFrom(config.formIds).forEach(function (formId) {
      var loadForm = MktoForms2.loadForm.bind(
          MktoForms2,
          config.podId,
          config.munchkinId,
          formId
        ),
        formEls = arrayFrom(
          document.querySelectorAll(
            "[" + MKTOFORM_ID_ATTRNAME + '="' + formId + '"]'
          )
        );

      (function loadFormCb(formEls) {
        var formEl = formEls.shift();
        formEl.id = "mktoForm_" + formId;

        loadForm(function (form) {
          formEl.id = "";
          if (formEls.length) {
            loadFormCb(formEls);
          }
        });
      })(formEls);
    });
  }

  // Initialize the forms
  if (mktoFormConfig.formIds.length > 0) {
    mktoFormChain(mktoFormConfig);
  }
});

/**
 * Display error message in all form containers
 *
 * @param {string} message Error message to display
 */
function displayError(message) {
  const containers = document.querySelectorAll('.marketo-form-container');
  containers.forEach(container => {
    container.innerHTML = `
      <div class="marketo-form-error" style="color: #e74c3c; border: 1px solid #e74c3c; padding: 15px; background: #fdf3f2;">
        <p><strong>Error:</strong> ${message}</p>
        <p>Please check the browser console for more details.</p>
      </div>
    `;
  });
}

/**
 * Dispatch a custom event when a Marketo form is submitted successfully
 *
 * @param {Object} values Form values
 * @param {string} formId Form ID
 */
window.dispatchFormSuccessEvent = function(values, formId) {
  const event = new CustomEvent('marketo:form:success', {
    detail: {
      values: values,
      formId: formId
    }
  });
  
  document.dispatchEvent(event);
};

/**
 * Dispatch a custom event when a Marketo form submission fails
 *
 * @param {Object} error Error object
 * @param {string} formId Form ID
 */
window.dispatchFormErrorEvent = function(error, formId) {
  const event = new CustomEvent('marketo:form:error', {
    detail: {
      error: error,
      formId: formId
    }
  });
  
  document.dispatchEvent(event);
};