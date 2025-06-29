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
} = wp.blockEditor;
const {
    PanelBody,
    TextControl,
    TextareaControl,
    ToggleControl,
} = wp.components;

// Register the block
registerBlockType('marketo-form-block/form', {
    title: __('Marketo Form', 'marketo-form-block'),
    icon: 'feedback',
    category: 'widgets',
    keywords: [
        __('marketo', 'marketo-form-block'),
        __('form', 'marketo-form-block'),
        __('marketing', 'marketo-form-block'),
    ],
    attributes: {
        formId: {
            type: 'string',
            default: '',
        },
        redirectUrl: {
            type: 'string',
            default: '',
        },
        successMessage: {
            type: 'string',
            default: __('Thank you for your submission!', 'marketo-form-block'),
        },
        errorMessage: {
            type: 'string',
            default: __('There was an error processing your submission. Please try again.', 'marketo-form-block'),
        },
        customCSS: {
            type: 'string',
            default: '',
        },
        disableDefaultStyles: {
            type: 'boolean',
            default: true,
        },
    },
    
    /**
     * Edit function for the block
     */
    edit: function(props) {
        const { attributes, setAttributes } = props;
        const {
            formId,
            redirectUrl,
            successMessage,
            errorMessage,
            customCSS,
            disableDefaultStyles,
        } = attributes;
        
        return [
            // Block inspector controls
            <InspectorControls key="inspector">
                <PanelBody title={__('Form Settings', 'marketo-form-block')} initialOpen={true}>
                    <TextControl
                        label={__('Marketo Form ID', 'marketo-form-block')}
                        value={formId}
                        onChange={(value) => setAttributes({ formId: value })}
                        help={__('Enter the Marketo Form ID', 'marketo-form-block')}
                    />
                    <TextControl
                        label={__('Redirect URL', 'marketo-form-block')}
                        value={redirectUrl}
                        onChange={(value) => setAttributes({ redirectUrl: value })}
                        help={__('Enter the URL to redirect to after form submission (optional)', 'marketo-form-block')}
                    />
                    <TextareaControl
                        label={__('Success Message', 'marketo-form-block')}
                        value={successMessage}
                        onChange={(value) => setAttributes({ successMessage: value })}
                        help={__('Message to display after successful form submission', 'marketo-form-block')}
                    />
                    <TextareaControl
                        label={__('Error Message', 'marketo-form-block')}
                        value={errorMessage}
                        onChange={(value) => setAttributes({ errorMessage: value })}
                        help={__('Message to display if form submission fails', 'marketo-form-block')}
                    />
                </PanelBody>
                
                <PanelBody title={__('Styling Options', 'marketo-form-block')} initialOpen={false}>
                    <ToggleControl
                        label={__('Disable Default Marketo Styles', 'marketo-form-block')}
                        checked={disableDefaultStyles}
                        onChange={(value) => setAttributes({ disableDefaultStyles: value })}
                        help={__('Enable this to remove Marketo\'s default styling and allow your theme styles to take precedence.', 'marketo-form-block')}
                    />
                    <TextareaControl
                        label={__('Custom CSS', 'marketo-form-block')}
                        value={customCSS}
                        onChange={(value) => setAttributes({ customCSS: value })}
                        help={__('Enter custom CSS to style the Marketo form. Use .mktoForm as the parent selector.', 'marketo-form-block')}
                        rows={8}
                    />
                </PanelBody>
            </InspectorControls>,
            
            // Block preview in editor
            <div className={props.className} key="preview">
                <div className="marketo-form-placeholder">
                    <h3>{__('Marketo Form', 'marketo-form-block')}</h3>
                    {formId ? (
                        <div>
                            <p><strong>{__('Form ID:', 'marketo-form-block')}</strong> {formId}</p>
                            {redirectUrl && (
                                <p><strong>{__('Redirect URL:', 'marketo-form-block')}</strong> {redirectUrl}</p>
                            )}
                            <p><strong>{__('Custom Styling:', 'marketo-form-block')}</strong> {customCSS ? __('Applied', 'marketo-form-block') : __('None', 'marketo-form-block')}</p>
                            <p><strong>{__('Default Styles:', 'marketo-form-block')}</strong> {disableDefaultStyles ? __('Disabled', 'marketo-form-block') : __('Enabled', 'marketo-form-block')}</p>
                        </div>
                    ) : (
                        <p className="marketo-form-placeholder-empty">
                            {__('Please enter a Marketo Form ID in the block settings.', 'marketo-form-block')}
                        </p>
                    )}
                </div>
            </div>
        ];
    },
    
    /**
     * Save function for the block
     * 
     * We're using server-side rendering, so this just returns null
     */
    save: function() {
        return null;
    },
});