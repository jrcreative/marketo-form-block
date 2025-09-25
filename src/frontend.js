/**
 * Marketo Form Block - Frontend JavaScript for Material Design Styling
 *
 * This script waits for Marketo forms to be ready, then manipulates the
 * DOM to apply a Material Design "floating label" effect and a custom
 * multi-select widget.
 */
( function () {
	// Ensure the Marketo Forms 2 API is available
	if ( typeof MktoForms2 === 'undefined' ) {
		console.error( 'Marketo Forms 2 API not found.' );
		return;
	}

	/**
	 * Removes unwanted Marketo elements, classes, and styles from a given node.
	 * @param {HTMLElement} node The element to clean.
	 */
	function cleanNode( node ) {
		// Remove unwanted elements
		node.querySelectorAll( 'div.mktoGutter, div.mktoOffset' ).forEach(
			( el ) => el.remove()
		);
		if (
			node.matches &&
			node.matches( 'div.mktoGutter, div.mktoOffset' )
		) {
			node.remove();
			return; // Element is gone, no more to do
		}

		// Remove unwanted classes and styles from the node itself and its children
		const elementsToClean = [];
		if (
			node.matches &&
			node.matches( '.mktoHasWidth, .mktoFormCol, .mktoButton' )
		) {
			elementsToClean.push( node );
		}
		node.querySelectorAll(
			'.mktoHasWidth, .mktoFormCol, .mktoButton'
		).forEach( ( el ) => elementsToClean.push( el ) );

		elementsToClean.forEach( ( el ) => {
			el.removeAttribute( 'style' );
			el.classList.remove( 'mktoHasWidth' );
			el.classList.remove( 'mktoFormCol' );
			if ( el.tagName === 'BUTTON' ) {
				el.classList.remove( 'mktoButton' );
				el.classList.add( 'button' );
			}
		} );
	}

	/**
	 * Applies Material Design styling to a single form field.
	 * @param {HTMLElement} field The input, select, or textarea element.
	 */
	function styleFormField( field ) {
		// Exclude fields that are part of a checkbox/radio list
		if (
			field.closest( '.mktoCheckboxList' ) ||
			field.closest( '.mktoRadioList' )
		) {
			return;
		}

		const fieldWrap = field.closest( '.mktoFieldWrap' );
		if (
			! fieldWrap ||
			fieldWrap.classList.contains( 'form-field-wrapper' )
		) {
			return; // Already styled
		}

		fieldWrap.classList.add( 'form-field-wrapper' );

		const label = fieldWrap.querySelector( '.mktoLabel' );
		if ( ! label ) return;

		// Handle multi-select fields with a custom widget
		if ( field.tagName === 'SELECT' && field.multiple ) {
			createMultiSelect( field, fieldWrap );
		} else {
			// Handle standard fields
			const updateFilledState = () => {
				const hasValue =
					field.tagName === 'SELECT'
						? field.value && field.value !== ''
						: field.value && field.value.trim() !== '';
				fieldWrap.classList.toggle( 'form-field--is-filled', hasValue );
			};

			field.addEventListener( 'focus', () =>
				fieldWrap.classList.add( 'form-field--is-active' )
			);
			field.addEventListener( 'blur', () => {
				fieldWrap.classList.remove( 'form-field--is-active' );
				updateFilledState();
			} );

			// Check initial state for pre-filled values
			updateFilledState();
		}
	}

	/**
	 * Applies Material Design styling and behavior to a Marketo form.
	 * @param {MktoForm} form The Marketo form object.
	 */
	function applyMaterialStyling( form ) {
		const formEl = form.getFormElem()[ 0 ];

		// Initial clean of the form
		cleanNode( formEl );

		// Initial styling of all fields
		const fieldSelector =
			'input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="password"], input[type="date"], input[type="number"], textarea, select';
		formEl.querySelectorAll( fieldSelector ).forEach( styleFormField );

		// Use MutationObserver to style fields and clean nodes added later
		const observer = new MutationObserver( ( mutations ) => {
			mutations.forEach( ( mutation ) => {
				if ( mutation.addedNodes ) {
					mutation.addedNodes.forEach( ( node ) => {
						if ( node.nodeType === 1 ) {
							// Element node
							cleanNode( node );
							if ( node.matches( fieldSelector ) ) {
								styleFormField( node );
							}
							node.querySelectorAll( fieldSelector ).forEach(
								styleFormField
							);
						}
					} );
				}
			} );
		} );

		observer.observe( formEl, { childList: true, subtree: true } );
	}

	/**
	 * Creates a custom multi-select widget to replace the browser default.
	 * @param {HTMLSelectElement} selectEl The original select element.
	 * @param {HTMLElement} wrapper The field wrapper element.
	 */
	function createMultiSelect( selectEl, wrapper ) {
		selectEl.style.display = 'none'; // Hide original

		const container = document.createElement( 'div' );
		container.className = 'multiselect-container';
		wrapper.appendChild( container );

		const selectedDisplay = document.createElement( 'div' );
		selectedDisplay.className = 'multiselect-selected';
		container.appendChild( selectedDisplay );

		const dropdown = document.createElement( 'div' );
		dropdown.className = 'multiselect-dropdown';
		container.appendChild( dropdown );

		const options = Array.from( selectEl.options );

		function updateSelectedDisplay() {
			selectedDisplay.innerHTML = '';
			options.forEach( ( option ) => {
				if ( option.selected ) {
					const chip = document.createElement( 'div' );
					chip.className = 'multiselect-chip';
					chip.textContent = option.textContent;

					const removeBtn = document.createElement( 'span' );
					removeBtn.className = 'multiselect-chip-remove';
					removeBtn.textContent = '×';
					removeBtn.addEventListener( 'click', ( e ) => {
						e.stopPropagation();
						option.selected = false;
						updateSelectedDisplay();
						updateDropdownOptions();
					} );

					chip.appendChild( removeBtn );
					selectedDisplay.appendChild( chip );
				}
			} );
			wrapper.classList.toggle(
				'form-field--is-filled',
				selectEl.selectedOptions.length > 0
			);
		}

		function updateDropdownOptions() {
			dropdown
				.querySelectorAll( '.multiselect-option' )
				.forEach( ( optEl ) => {
					const option = options.find(
						( o ) => o.value === optEl.dataset.value
					);
					optEl.classList.toggle( 'is-selected', option.selected );
				} );
		}

		options.forEach( ( option ) => {
			const optionEl = document.createElement( 'div' );
			optionEl.className = 'multiselect-option';
			optionEl.textContent = option.textContent;
			optionEl.dataset.value = option.value;
			optionEl.addEventListener( 'click', () => {
				option.selected = ! option.selected;
				updateSelectedDisplay();
				updateDropdownOptions();
			} );
			dropdown.appendChild( optionEl );
		} );

		selectedDisplay.addEventListener( 'click', () => {
			dropdown.classList.toggle( 'is-open' );
			wrapper.classList.toggle(
				'form-field--is-active',
				dropdown.classList.contains( 'is-open' )
			);
		} );

		document.addEventListener( 'click', ( e ) => {
			if ( ! container.contains( e.target ) ) {
				dropdown.classList.remove( 'is-open' );
				wrapper.classList.remove( 'form-field--is-active' );
			}
		} );

		updateSelectedDisplay();
		updateDropdownOptions();
	}

	// Use the whenReady hook to apply styling to each form as it loads.
	MktoForms2.whenReady( function ( form ) {
		applyMaterialStyling( form );
	} );
} )();
