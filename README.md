# Marketo Form Block

A WordPress Gutenberg block for embedding Marketo forms with custom styling options.

## Description

The Marketo Form Block plugin allows you to easily embed Marketo forms into your WordPress content using the Gutenberg editor. The plugin provides a custom block that integrates with Marketo's Forms 2.0 JavaScript API and offers advanced features such as:

- Custom form styling with CSS
- Option to disable Marketo's default styling
- Custom success and error messages
- Form validation
- Redirect after form submission

## Installation

1. Upload the `marketo-form-block` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Configure your Marketo instance settings (see Configuration section below)
4. The Marketo Form block will be available in the Gutenberg editor under the 'Widgets' category

## Configuration

1. Go to Settings > Marketo Form Block in your WordPress admin
2. Enter your Marketo Instance URL (e.g., app-ab33.marketo.com)
3. Enter your Marketo Munchkin ID (e.g., 041-FSQ-281)
4. Click "Save Changes"

You can find your Marketo Instance URL and Munchkin ID in your Marketo Admin interface or by contacting your Marketo administrator.

## Requirements

- WordPress 5.8 or higher
- Gutenberg editor
- Access to Marketo forms

## Development

### Requirements

- Node.js 14.0.0 or higher
- npm 6.0.0 or higher

### Setup

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run start` to start the development server

### Build

To build the plugin assets:

```
npm run build
```

### Creating a Distribution Package

To create a distributable .zip file that includes only the production files:

```
npm run build:zip
```

This will create a .zip file in the root directory that can be installed as a WordPress plugin. The .zip file will include only the necessary files for production and exclude development files.

## Usage

### Adding a Marketo Form to Your Content

1. Edit a post or page using the Gutenberg editor
2. Click the "+" button to add a new block
3. Search for "Marketo Form" and select the block
4. In the block settings sidebar, enter your Marketo Form ID
5. Configure additional options as needed

### Block Settings

The Marketo Form block includes the following settings:

#### Form Settings

- **Marketo Form ID** (required): The ID of your Marketo form
- **Redirect URL** (optional): URL to redirect to after successful form submission
- **Success Message**: Message to display after successful form submission
- **Error Message**: Message to display if form submission fails

#### Styling Options

- **Disable Default Marketo Styles**: Toggle to remove Marketo's default styling
- **Custom CSS**: Enter custom CSS to style the form

### Custom CSS Examples

Here are some examples of custom CSS you can use to style your Marketo form:

```css
/* Change form width */
.mktoForm {
  width: 100% !important;
  max-width: 500px;
}

/* Style form labels */
.mktoForm .mktoLabel {
  color: #333;
  font-weight: 600;
}

/* Style form fields */
.mktoForm .mktoField {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
}

/* Style submit button */
.mktoForm .mktoButton {
  background-color: #0073aa;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
}
```

## Frequently Asked Questions

### Where do I find my Marketo Form ID?

You can find your Marketo Form ID in the Marketo Lead Management interface. Navigate to Design Studio > Forms, select your form, and look for the Form ID in the form details.

### Where do I find my Marketo Instance URL and Munchkin ID?

- **Marketo Instance URL**: This is the base URL of your Marketo instance, typically in the format `app-XXXX.marketo.com`. You can find this in the URL when you log into Marketo.

- **Munchkin ID**: This is a unique identifier for your Marketo account. You can find it in your Marketo Admin interface under Integration > Munchkin. It's typically in the format `XXX-XXX-XXX`.

### How do I customize the form styling?

You can customize the form styling by:
1. Enabling the "Disable Default Marketo Styles" option
2. Adding your custom CSS in the "Custom CSS" field
3. Using the `.mktoForm` selector as the parent selector for your styles

### Can I use this plugin with Marketo's REST API?

No, this plugin is designed to work with Marketo's Forms 2.0 JavaScript API. It does not support the Marketo REST API.

## Changelog

### 1.0.0
* Initial release

## Credits

This plugin was developed by [Your Name/Company].

## License

This plugin is licensed under the GPL v2 or later.