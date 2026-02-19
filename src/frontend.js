/**
 * Marketo Form Block - Frontend JavaScript for Material Design Styling
 *
 * This script waits for Marketo forms to be ready, then manipulates the
 * DOM to apply a Material Design "floating label" effect and a custom
 * multi-select widget.
 */
(function () {
	// Ensure the Marketo Forms 2 API is available
	if (typeof MktoForms2 === 'undefined') {
		console.error('Marketo Forms 2 API not found.');
		return;
	}

	/**
	 * Removes unwanted Marketo elements, classes, and styles from a given node.
	 * @param {HTMLElement} node The element to clean.
	 */
	function cleanNode(node) {
		// Remove unwanted elements
		node.querySelectorAll('div.mktoGutter, div.mktoOffset').forEach(
			(el) => el.remove()
		);
		if (
			node.matches &&
			node.matches('div.mktoGutter, div.mktoOffset')
		) {
			node.remove();
			return; // Element is gone, no more to do
		}

		// Remove unwanted classes and styles from the node itself and its children
		const elementsToClean = [];
		if (
			node.matches &&
			node.matches('.mktoHasWidth, .mktoFormCol, .mktoButton')
		) {
			elementsToClean.push(node);
		}
		node.querySelectorAll(
			'.mktoHasWidth, .mktoFormCol, .mktoButton'
		).forEach((el) => elementsToClean.push(el));

		elementsToClean.forEach((el) => {
			el.removeAttribute('style');
			el.classList.remove('mktoHasWidth');
			el.classList.remove('mktoFormCol');
			if (el.tagName === 'BUTTON') {
				el.classList.remove('mktoButton');
				el.classList.add('button');
			}
		});
	}

	/**
	 * Applies Material Design styling to a single form field.
	 * @param {HTMLElement} field The input, select, or textarea element.
	 */
	function styleFormField(field) {
		// Exclude fields that are part of a checkbox/radio list
		if (
			field.closest('.mktoCheckboxList') ||
			field.closest('.mktoRadioList')
		) {
			return;
		}

		const fieldWrap = field.closest('.mktoFieldWrap');
		if (
			!fieldWrap ||
			fieldWrap.classList.contains('form-field-wrapper')
		) {
			return; // Already styled
		}

		fieldWrap.classList.add('form-field-wrapper');

		const label = fieldWrap.querySelector('.mktoLabel');
		if (!label) return;

		// Handle multi-select fields with a custom widget
		if (field.tagName === 'SELECT' && field.multiple) {
			createMultiSelect(field, fieldWrap);
		} else {
			// Handle standard fields
			const updateFilledState = () => {
				const hasValue =
					field.tagName === 'SELECT'
						? field.value && field.value !== ''
						: field.value && field.value.trim() !== '';
				fieldWrap.classList.toggle('form-field--is-filled', hasValue);
			};

			field.addEventListener('focus', () =>
				fieldWrap.classList.add('form-field--is-active')
			);
			field.addEventListener('blur', () => {
				fieldWrap.classList.remove('form-field--is-active');
				updateFilledState();
			});

			// Check initial state for pre-filled values
			updateFilledState();
		}
	}

	/**
	 * Applies Material Design styling and behavior to a Marketo form.
	 * @param {MktoForm} form The Marketo form object.
	 */
	function applyMaterialStyling(form) {
		const formEl = form.getFormElem()[0];

		// Initial clean of the form
		cleanNode(formEl);

		// Initial styling of all fields
		const fieldSelector =
			'input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="password"], input[type="date"], input[type="number"], textarea, select';
		formEl.querySelectorAll(fieldSelector).forEach(styleFormField);

		// Use MutationObserver to style fields and clean nodes added later
		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.addedNodes) {
					mutation.addedNodes.forEach((node) => {
						if (node.nodeType === 1) {
							// Element node
							cleanNode(node);
							if (node.matches(fieldSelector)) {
								styleFormField(node);
							}
							node.querySelectorAll(fieldSelector).forEach(
								styleFormField
							);
						}
					});
				}
			});
		});

		observer.observe(formEl, { childList: true, subtree: true });
	}

	/**
	 * Creates a custom multi-select widget to replace the browser default.
	 * @param {HTMLSelectElement} selectEl The original select element.
	 * @param {HTMLElement} wrapper The field wrapper element.
	 */
	function createMultiSelect(selectEl, wrapper) {
		selectEl.style.display = 'none'; // Hide original
		selectEl.setAttribute('aria-hidden', 'true');
		selectEl.tabIndex = -1;

		const container = document.createElement('div');
		container.className = 'multiselect-container';
		wrapper.appendChild(container);

		const selectedDisplay = document.createElement('div');
		selectedDisplay.className = 'multiselect-selected';
		container.appendChild(selectedDisplay);

		const dropdown = document.createElement('div');
		dropdown.className = 'multiselect-dropdown';
		container.appendChild(dropdown);

		// Accessibility: ARIA roles and tab order
		const dropdownId = 'ms-dd-' + Math.random().toString(36).slice(2);
		dropdown.id = dropdownId;
		dropdown.setAttribute('role', 'listbox');
		dropdown.setAttribute('aria-multiselectable', 'true');

		selectedDisplay.setAttribute('tabindex', '0');
		selectedDisplay.setAttribute('role', 'combobox');
		selectedDisplay.setAttribute('aria-haspopup', 'listbox');
		selectedDisplay.setAttribute('aria-expanded', 'false');
		selectedDisplay.setAttribute('aria-controls', dropdownId);

		// Link combobox to its visible label for screen readers
		const labelEl = wrapper.querySelector('.mktoLabel');
		if (labelEl) {
			if (!labelEl.id) {
				labelEl.id = 'ms-lbl-' + Math.random().toString(36).slice(2);
			}
			selectedDisplay.setAttribute('aria-labelledby', labelEl.id);
		} else if (selectEl.name) {
			selectedDisplay.setAttribute('aria-label', selectEl.name);
		}

		let currentActiveIndex = -1;

		function openDropdown() {
			dropdown.classList.add('is-open');
			wrapper.classList.add('form-field--is-active');
			selectedDisplay.setAttribute('aria-expanded', 'true');
		}

		function closeDropdown() {
			dropdown.classList.remove('is-open');
			wrapper.classList.remove('form-field--is-active');
			selectedDisplay.setAttribute('aria-expanded', 'false');
			currentActiveIndex = -1;
		}

		function focusOption(index) {
			const opts = Array.from(dropdown.querySelectorAll('.multiselect-option'));
			if (opts.length === 0) return;
			if (index < 0) index = 0;
			if (index >= opts.length) index = opts.length - 1;
			currentActiveIndex = index;
			opts[index].focus();
		}

		const options = Array.from(selectEl.options);

		function updateSelectedDisplay() {
			selectedDisplay.innerHTML = '';
			options.forEach((option) => {
				if (option.selected) {
					const chip = document.createElement('div');
					chip.className = 'multiselect-chip';
					chip.textContent = option.textContent;

					const removeBtn = document.createElement('button');
					removeBtn.type = 'button';
					removeBtn.className = 'multiselect-chip-remove';
					removeBtn.setAttribute('aria-label', 'Remove ' + option.textContent);
					removeBtn.textContent = '×';
					removeBtn.addEventListener('click', (e) => {
						e.stopPropagation();
						option.selected = false;
						updateSelectedDisplay();
						updateDropdownOptions();
					});

					chip.appendChild(removeBtn);
					selectedDisplay.appendChild(chip);
				}
			});
			wrapper.classList.toggle(
				'form-field--is-filled',
				selectEl.selectedOptions.length > 0
			);
		}

		function updateDropdownOptions() {
			dropdown
				.querySelectorAll('.multiselect-option')
				.forEach((optEl) => {
					const option = options.find(
						(o) => o.value === optEl.dataset.value
					);
					const isSel = option.selected;
					optEl.classList.toggle('is-selected', isSel);
					optEl.setAttribute('aria-selected', isSel ? 'true' : 'false');
				});
		}

		options.forEach((option) => {
			const optionEl = document.createElement('div');
			optionEl.className = 'multiselect-option';
			optionEl.textContent = option.textContent;
			optionEl.dataset.value = option.value;
			optionEl.setAttribute('role', 'option');
			optionEl.setAttribute('tabindex', '-1');
			optionEl.setAttribute('aria-selected', option.selected ? 'true' : 'false');
			optionEl.addEventListener('click', () => {
				option.selected = !option.selected;
				updateSelectedDisplay();
				updateDropdownOptions();
				optionEl.focus();
			});
			dropdown.appendChild(optionEl);
		});

		selectedDisplay.addEventListener('click', () => {
			if (dropdown.classList.contains('is-open')) {
				closeDropdown();
			} else {
				openDropdown();
				focusOption(0);
			}
		});

		selectedDisplay.addEventListener('focus', () => {
			wrapper.classList.add('form-field--is-active');
		});

		selectedDisplay.addEventListener('blur', () => {
			// Close if focus moved outside the widget
			setTimeout(() => {
				if (!container.contains(document.activeElement)) {
					closeDropdown();
				}
			}, 0);
		});

		selectedDisplay.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				if (dropdown.classList.contains('is-open')) {
					closeDropdown();
				} else {
					openDropdown();
					focusOption(0);
				}
			} else if (e.key === 'ArrowDown') {
				e.preventDefault();
				if (!dropdown.classList.contains('is-open')) openDropdown();
				focusOption(0);
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				if (!dropdown.classList.contains('is-open')) openDropdown();
				const lastIndex = dropdown.querySelectorAll('.multiselect-option').length - 1;
				focusOption(lastIndex);
			}
		});

		dropdown.addEventListener('keydown', (e) => {
			const opts = Array.from(dropdown.querySelectorAll('.multiselect-option'));
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				focusOption(currentActiveIndex + 1);
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				focusOption(currentActiveIndex - 1);
			} else if (e.key === 'Home') {
				e.preventDefault();
				focusOption(0);
			} else if (e.key === 'End') {
				e.preventDefault();
				focusOption(opts.length - 1);
			} else if (e.key === 'Escape') {
				e.preventDefault();
				closeDropdown();
				selectedDisplay.focus();
			} else if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				if (currentActiveIndex >= 0) {
					const optEl = opts[currentActiveIndex];
					const option = options.find((o) => o.value === optEl.dataset.value);
					option.selected = !option.selected;
					updateSelectedDisplay();
					updateDropdownOptions();
				}
			} else if (e.key === 'Tab') {
				closeDropdown();
			}
		});

		document.addEventListener('click', (e) => {
			if (!container.contains(e.target)) {
				closeDropdown();
			}
		});

		updateSelectedDisplay();
		updateDropdownOptions();
	}

	MktoForms2.whenReady(function (form) {

		const formEl = form.getFormElem()[0];

		applyMaterialStyling(form);

		// Only target your specific form ID if needed
		if (form.getId() !== 2587) {
			return;
		}

		// Find wrapper with the unique block ID
		const wrapper = formEl.closest('[id^="mkto-form-"]');
		if (!wrapper) {
			console.error('Marketo block wrapper not found.');
			return;
		}

		const blockId = wrapper.id;

		const blockSettings = window.MarketoBlockSettings
			? window.MarketoBlockSettings[blockId]
			: null;

		const successEl = wrapper.querySelector('.marketo-form-success');
		if (!successEl) {
			console.error('Success element not found.');
			return;
		}

		let isCheckingFlex = false;

		form.onSubmit(function () {

			// Prevent default Marketo submission
			form.submittable(false);

			if (isCheckingFlex) {
				return false;
			}
			isCheckingFlex = true;

			const vals = form.vals();
			const email = vals.Email;
			const company = vals.flexCompanyName || vals.Company || '';
			const firstName = vals.FirstName || '';
			const lastName = vals.LastName || '';

			if (!email) {
				isCheckingFlex = false;
				successEl.style.display = 'block';
				successEl.textContent = 'We could not read your email address. Please try again.';
				return false;
			}

			if (!company) {
				isCheckingFlex = false;
				successEl.style.display = 'block';
				successEl.textContent = 'Company name is required. Please complete the form and try again.';
				return false;
			}

			// Show processing state
			formEl.style.display = 'none';
			successEl.style.display = 'block';
			successEl.innerHTML = '<span class="marketo-spinner"></span>Processing...';

			const body = new URLSearchParams();
			body.append('action', 'flex_marketo_check');
			body.append('email', email);
			body.append('company', company);
			body.append('first_name', firstName);
			body.append('last_name', lastName);

			fetch(MarketoFlexAjax.ajax_url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
				},
				body: body.toString()
			})
				.then(function (res) {
					return res.json();
				})
				.then(function (data) {

					isCheckingFlex = false;

					// === EXISTING USER ===
					if (
						data &&
						data.success &&
						data.data &&
						data.data.error &&
						String(data.data.error).toLowerCase().includes('already has flex trial')
					) {
						const url = 'https://manage.attackiqready.com/login?next=';
						successEl.innerHTML =
							'You already have an account. <a href="' + url + '">Log in here</a>.';
						return;
					}

					// === NEW USER ===
					if (data && data.success) {

						// If block has redirect URL configured
						if (blockSettings && blockSettings.redirectUrl) {
							window.location.href = blockSettings.redirectUrl;
							return;
						}

						// Otherwise show block success message
						if (blockSettings && blockSettings.successMessage) {
							successEl.innerHTML = blockSettings.successMessage;
							return;
						}

						// Fallback
						successEl.innerHTML = 'Thank you.';
						return;
					}

					// === ERROR FALLBACK ===
					successEl.textContent =
						(data && data.message)
							? data.message
							: 'Your submission could not be processed. Please try again.';
				})
				.catch(function () {
					isCheckingFlex = false;
					successEl.textContent = 'Could not contact endpoint. Please try again.';
				});

			return false; // Always block native Marketo submission
		});
	});
})();
