/**
 * Marketo Form Block - Gutenberg Block
 *
 * @package Marketo_Form_Block
 */

// Import WordPress dependencies
const { __ } = wp.i18n;
const { registerBlockType } = wp.blocks;
const {
	InspectorControls,
	PanelColorSettings,
	BlockControls,
	AlignmentToolbar,
	useBlockProps,
} = wp.blockEditor;
const { PanelBody, TextControl, TextareaControl, ToggleControl } =
	wp.components;

// Register the block
registerBlockType( 'marketo-form-block/form', {
	title: __( 'Marketo Form', 'marketo-form-block' ),
	icon: 'feedback',
	category: 'widgets',
	keywords: [
		__( 'marketo', 'marketo-form-block' ),
		__( 'form', 'marketo-form-block' ),
		__( 'marketing', 'marketo-form-block' ),
	],
	attributes: {
		formId: {
			type: 'string',
			default: '',
		},
		backgroundColor: {
			type: 'string',
		},
		textColor: {
			type: 'string',
		},
		redirectUrl: {
			type: 'string',
			default: '',
		},
		headingColor: {
			type: 'string',
		},
		successMessage: {
			type: 'string',
			default: __(
				'Thank you for your submission!',
				'marketo-form-block'
			),
		},
		accentColor: {
			type: 'string',
		},
		align: {
			type: 'string',
		},
	},

	/**
	 * Edit function for the block
	 */
	edit: function ( props ) {
		const { attributes, setAttributes } = props;
		const {
			formId,
			redirectUrl,
			successMessage,
			accentColor,
			align,
			backgroundColor,
			textColor,
			headingColor,
		} = attributes;

		const blockProps = useBlockProps( {
			style: {
				textAlign: align,
				'--marketo-accent-color': accentColor,
				'--marketo-background-color': backgroundColor,
				'--marketo-text-color': textColor,
				'--marketo-heading-color': headingColor,
			},
		} );

		return (
			<div { ...blockProps }>
				<BlockControls>
					<AlignmentToolbar
						value={ align }
						onChange={ ( newAlign ) =>
							setAttributes( { align: newAlign } )
						}
					/>
				</BlockControls>
				<InspectorControls key="inspector">
					<PanelBody
						title={ __( 'Form Settings', 'marketo-form-block' ) }
						initialOpen={ true }
					>
						<TextControl
							label={ __(
								'Marketo Form ID',
								'marketo-form-block'
							) }
							value={ formId }
							onChange={ ( value ) =>
								setAttributes( { formId: value } )
							}
							help={ __(
								'Enter the Marketo Form ID',
								'marketo-form-block'
							) }
						/>
						<TextControl
							label={ __( 'Redirect URL', 'marketo-form-block' ) }
							value={ redirectUrl }
							onChange={ ( value ) =>
								setAttributes( { redirectUrl: value } )
							}
							help={ __(
								'Enter the URL to redirect to after form submission (optional)',
								'marketo-form-block'
							) }
						/>
						<TextareaControl
							label={ __(
								'Success Message',
								'marketo-form-block'
							) }
							value={ successMessage }
							onChange={ ( value ) =>
								setAttributes( { successMessage: value } )
							}
							help={ __(
								'Message to display after successful form submission',
								'marketo-form-block'
							) }
						/>
					</PanelBody>

					<PanelBody
						title={ __( 'Styling Options', 'marketo-form-block' ) }
						initialOpen={ false }
					>
						<PanelColorSettings
							title={ __(
								'Color Settings',
								'marketo-form-block'
							) }
							initialOpen={ false }
							colorSettings={ [
								{
									value: backgroundColor,
									onChange: ( color ) =>
										setAttributes( {
											backgroundColor: color,
										} ),
									label: __(
										'Background Color',
										'marketo-form-block'
									),
								},
								{
									value: textColor,
									onChange: ( color ) =>
										setAttributes( { textColor: color } ),
									label: __(
										'Text Color',
										'marketo-form-block'
									),
								},
								{
									value: accentColor,
									onChange: ( color ) =>
										setAttributes( { accentColor: color } ),
									label: __(
										'Accent Color',
										'marketo-form-block'
									),
								},
								{
									value: headingColor,
									onChange: ( color ) =>
										setAttributes( {
											headingColor: color,
										} ),
									label: __(
										'Heading Color',
										'marketo-form-block'
									),
								},
							] }
						/>
					</PanelBody>
				</InspectorControls>
				<div className="marketo-form-placeholder">
					<h3>{ __( 'Marketo Form', 'marketo-form-block' ) }</h3>
					{ formId ? (
						<div>
							<p>
								<strong>
									{ __( 'Form ID:', 'marketo-form-block' ) }
								</strong>{ ' ' }
								{ formId }
							</p>
							{ redirectUrl && (
								<p>
									<strong>
										{ __(
											'Redirect URL:',
											'marketo-form-block'
										) }
									</strong>{ ' ' }
									{ redirectUrl }
								</p>
							) }
						</div>
					) : (
						<p className="marketo-form-placeholder-empty">
							{ __(
								'Please enter a Marketo Form ID in the block settings.',
								'marketo-form-block'
							) }
						</p>
					) }
				</div>
			</div>
		);
	},

	/**
	 * Save function for the block
	 *
	 * We're using server-side rendering, so this just returns null
	 */
	save: function () {
		return null;
	},
} );
