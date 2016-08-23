'use strict';

/**
 * Adds window.onload event handler neatly so that
 * any previously assigned handlers are preserved and executed.
 * @param  {Function} fn Event handler
 * @return {undefined}
 */
function properWindowOnload(fn) {
  // assign any pre-defined functions on 'window.onload' to a variable
  var oldOnLoad = window.onload;
  // if there is not any function hooked to it
  if (typeof window.onload != 'function') {
    // you can hook your function with it
    window.onload = fn;
  } else { // someone already hooked a function
    window.onload = function () {
      // call the function hooked already
      oldOnLoad();
      // call your awesome function
      fn();
    }
  }
}

/**
 * Module wrapper
 * @return {Function}
 */
var djpressor = function () {

  /**
   * CONSTANTS
   * @type {Object}
   */
  var TEMPLATE_SELECTORS = {
      INPUT: 'input[data-s3-enabled="enabled"]',
    },
    DJP_CLASSNAMES = {
      CONTAINER: 'djpressor-module',
      UPLOAD_GROUP: 'djpressor-upload-group',
      FILE_INPUT: 'djpressor-file-input',
      UPLOAD_BTN: 'djpressor-upload-btn button button--outlined button--s', //reuse main site styles
      REMOVE_BTN: 'djpressor-remove-btn button button--warning button--s grp-button', //reuse main site styles
      PREVIEW: 'djpressor-preview', // Class that'll be given to preview box attached right after the input field.
    },
    TEXTS = {
      UPLOAD: 'Upload',
      REMOVE: 'Remove',
      PREVIEW_ALT: 'Image preview',
      UPLOADING: 'Uploading...',
    };

  /**
   * - Updates and manages image upload form fields generated by Django template.
   * - Handles image resizing according to specification in spec.js.
   * - Manages images upload to AWS servers.
   * @type {Object}
   */
  var imageFieldManager = {

    /**
     * Verify the following items are available:
     * - Image upload form field
     * - AWS Auth (Amazon SDK js file)
     * - Specification for image resizing (specs.js)
     *
     * @return {[type]} [description]
     */
    checkPrerequisites: function () {

      if ($('.' + DJP_CLASSNAMES.FILE_INPUT).length > 0) {
        console.log('Djpressor: The module has been instantiated already.');
        return false;
      }

      /**
       * Verify the image upload form field is available in the template
       */
      if ($(TEMPLATE_SELECTORS.INPUT).length == 0) {
        console.log('Djpressor: No image upload form fields found.');
        console.log('Djpressor. Form field selector: ' + TEMPLATE_SELECTORS.INPUT);
        return false;
      }

      /**
       * Verify the image sizes specification is available (specs.js)
       */
      //TODO add check for the AWSB object
      if (fbm_image_specs == undefined || object_identifier == undefined || user_api_auth_token == undefined) {
        console.log('Djpressor: Image specifications not available. Djpressor execution aborted.');
        return false;
      }

      /**
       * All is well!
       */
      return true;
    },

    /**
     * Get template form elements and
     * initialize required vars.
     * @return {undefined}
     */
    init: function () {

      /**
       * Get template form elements for future use
       * @type {jQueryWrapperObject}
       */
      this.$input = $(TEMPLATE_SELECTORS.INPUT);
      this.$form = this.$input.closest('form');
      this.$label = this.$input.siblings('.formField-label');
      this.$submit = this.$form.find(':submit:first');

      /**
       * Get submit button text to be able to update the button text on image upload and
       * then safely revert back to the initial value.
       * @type {String}
       */
      this.submitValue = this.$submit.val() || 'Save';

      /**
       * Flag that indicates whether the image upload is being processed
       * @type {Boolean}
       */
      this.canSubmitForm = true;

      /**
       * Collection of URL addresses to the uploaded image in different sizes
       * @type {Array}
       */
      this.uploaded = [];
    },

    /**
     * Creates Djpressor module html element and
     * adds it to the DOM and
     * update server-generated template elements.
     * @param {JqueryWrapperObject} $input Server-generated input DOM element
     * @return {undefined}
     */
    addUploadModuleEl: function () {

      // The module html structure
      //  <div class="djpressor-module">
      //    <h3></h3>
      //    <div class="djpressor-upload-group">
      //      <input class="djpressor-file-input" type="file" />
      //      <button class="djpressor-upload-btn button button--outlined button--s" type="button"></button>
      //    </div>
      //    <button class="djpressor-remove-btn button button--outlined button--s" type="button"></button>
      //    <img class="djpressor-preview" alt="Image preview">
      //  </div>

      var $input = $(TEMPLATE_SELECTORS.INPUT),
        $originalFormField = $input.closest('.formField'),
        $originalLabel = $input.siblings('.formField-label'),
        isPreviewEnabled = $input.data('enable-preview'),
        // Path to the existing image
        previewUrl = $input.attr('value') || '';

      /**
       * Create html elements for the upload module and
       * add them to the DOM
       */
      // Checking for .formField container to find out whether it is client site or admin site.
      // Admin site does not have .formField containers.
      // TODO check with backend guys whether we can have isAdminSite flag
      if ($originalFormField.length > 0) {
        /**
         * For client website
         */
        var $moduleEl = $('<div>', {
            'class': DJP_CLASSNAMES.CONTAINER
          }),
          $headingEl = $('<h3>').html($originalLabel.find('label').html()),
          $uploadEl = $('<div>', {
            'class': DJP_CLASSNAMES.UPLOAD_GROUP
          }),
          $uploadInputEl = $('<input />', {
            type: 'file',
            'class': DJP_CLASSNAMES.FILE_INPUT
          }),
          $uploadBtnEl = $('<button>', {
            'type': 'button',
            'class': DJP_CLASSNAMES.UPLOAD_BTN,
            text: TEXTS.UPLOAD
          }),
          $removeEl = $('<button>', {
            'type': 'button',
            'class': DJP_CLASSNAMES.REMOVE_BTN,
            text: TEXTS.REMOVE,
            style: 'display: none;'
          }),
          $previewEl = $('<img />', {
            'class': DJP_CLASSNAMES.PREVIEW,
            src: previewUrl || '',
            alt: TEXTS.PREVIEW_ALT
          });

        // Update server-generated form controls
        $originalFormField.css('border', 'none');
        $originalLabel.css('display', 'none');
        $input.css('display', 'none');

        // Construct the module html structure
        $uploadEl
          .append([$uploadBtnEl, $uploadInputEl]);

        if (previewUrl) {
          $removeEl.css('display', 'unset');
        }

        // Add the module to the DOM
        $moduleEl
          .data('djpressor', 'for-' + $input.attr('id'))
          .append([$headingEl, $uploadEl, $removeEl]);

        if (isPreviewEnabled) {
          $moduleEl.append($previewEl);
        }

        $moduleEl.appendTo($input.parent());

      } else {
        /**
         * For admin website
         */
        $input.css('display', 'none');

        //TODO move html generation to a separate method
        var $uploadInputEl = $('<input />', {
            type: 'file',
            'class': DJP_CLASSNAMES.FILE_INPUT
          }),
          $removeEl = $('<button>', {
            'type': 'button',
            'class': DJP_CLASSNAMES.REMOVE_BTN,
            text: TEXTS.REMOVE,
            style: 'display: none; width: auto;'
          });

        $input.parent().append($uploadInputEl, $removeEl);

        if (isPreviewEnabled) {
          var $previewEl = $('<img />', {
            'class': DJP_CLASSNAMES.PREVIEW,
            src: previewUrl || '',
            alt: TEXTS.PREVIEW_ALT,
            style: 'display: block; margin-top: 1rem; width: 30rem; ',
          });

          $input.parent().append($previewEl);

          if (previewUrl) {
            $removeEl.css('display', 'unset');
          }
        }
      }
    },

    /**
     * Update content of the preview element.
     * @param  {JqueryWrapperObject} $moduleEl Djpressor module DOM element
     * @param  {String} url       Preview image URL address
     * @return {undefined}
     */
    updateModuleElOnUpload: function (ev, imageUrl) {

      if (ev === undefined || typeof imageUrl !== 'string') {
        return new Error('Djpressor: Bad parameters.');
      }

      //Look for already existing preview element
      var $currentPreviewEl = $(ev.target).closest('form').find('.' + DJP_CLASSNAMES.PREVIEW),
        $removeEl = $('.' + DJP_CLASSNAMES.REMOVE_BTN.replace(/\s/g, '.'));

      //Update the existing preview
      $currentPreviewEl.attr('src', imageUrl);

      // Settings styles instead of classes because
      // admin site lacks client site classes.
      if (imageUrl === '') {
        $currentPreviewEl.css('display', 'none');
        $removeEl.css('visibility', 'hidden');
      } else {
        $currentPreviewEl.css('display', 'block');
        $removeEl.css('visibility', 'visible');
      }
    },

    /**
     * Clears 'value' attribute of server-generated input field so that
     * on form submit the server clears the image URL address.
     * @param  {DOMEvent} ev Button click event
     * @return {undefined}
     */
    removeImg: function (ev) {

      ev.preventDefault();

      //Clear the image value to be saved to server
      $(ev.target)
        .closest('form')
        .find(TEMPLATE_SELECTORS.INPUT)
        .attr('value', '');

      this.updateModuleElOnUpload(ev, '');

    },

    setupAWSBackend: function () {
      //Save 'this' for future use in callbacks
      var manager = this;

      // Temp way to load backend. TODO: Make me better.
      var backend = fbm_image_specs['default_backend'];

      this.bucket_name = backend.aws_s3_bucket;
      this.region = backend.aws_region;

      // URL to get Cognito OpenID Token
      var auth_url = '/auth/aws/djpressor/';

      var auth_headers = {
        Authorization: 'Token ' + user_api_auth_token,
      };

      // 1- Get Cognito OpenID token + Cognito Identity ID for user
      // 2- Get Cognito identity creds
      // 3- Set those creds to AWS client creds config.
      // 4- Set aws_bucket
      $.ajax({
        url: auth_url,
        dataType: 'json',
        headers: auth_headers,
        success: function (creds) {

          var aws_creds_r_params = {
            // AWS Cognito Identity Pool ID
            IdentityPoolId: backend.aws_identity_pool,
            IdentityId: creds.IdentityId,
            RoleSessionName: 'web',
            Logins: {
              'cognito-identity.amazonaws.com': creds.Token
            }
          };

          // Setup AWS Creds
          var aws_creds = new AWS.CognitoIdentityCredentials(aws_creds_r_params);

          // Configure AWS credential
          AWS.config.credentials = aws_creds;

          // Configure region
          AWS.config.region = manager.region;

          manager.aws_bucket = new AWS.S3({
            params: {
              Bucket: manager.bucket_name
            }
          });
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
          console.log('Djpressor: Error returned from ' + url);
          console.log('Djpressor: Error: ' + textStatus + ' ' + errorThrown);
        }
      })
    },

    // Function that uploads a single blob to S3 bucket destination
    uploadToS3: function (source, content_type, key_name) {
      var manager = this;
      var params = {
        Key: key_name,
        ContentType: content_type,
        Body: source,
        ACL: 'public-read'
      };

      // disable form submission until stuff get uploaded
      manager.canSubmitForm = false;

      // Disable form submit btn
      manager.changeSubmitBtnState(false);

      this.aws_bucket.upload(params, function (err, data) {
        if (!err) {
          manager.uploaded.push(data.Location);
        };

        // Enable submit button when uploads are completed.
        // We don't care whether the upload was successful or failed.
        manager.canSubmitForm = true;

        // Disable form submit btn
        manager.changeSubmitBtnState(true);
      });
    },

    /**
     * Add hidden inputs for all image sizes to teh form for further processing by Django
     * @param  {DOMEvent} e DOM event
     * @return {undefined}
     */
    formPreSubmit: function (e) {

      var manager = this;

      // Create hidden input fields for
      // each of the uploaded files so they get submitted
      // along with the form
      if (!manager.canSubmitForm) {

        // Disallow submitting the form when image processing and upload is in progress
        e.preventDefault();
        return false;
      } else if (manager.uploaded.length > 0) {

        for (var i = 0; i < manager.uploaded.length; i++) {

          // Remove '_temp' suffix from image file name in URL
          var newImgUrl = manager.uploaded[i].replace(/_temp/g, ''),
            // Get image size name from file name
            // TODO get sizedata from S3 data
            sizeName = /[\w. ]+$/.exec(newImgUrl)[0].replace(/\.jpg/g, '');

          // TODO Why?
          $('<input />', {
            type: 'hidden',
            name: sizeName,
            value: newImgUrl,
          }).prependTo(manager.$form);
        }

        // Remove file input so file doesn't get submitted to form, wasting memory
        // and set the value to the original.jpg file
        var newFullsizeImgUrl = manager.uploaded[0].replace(/[\w. ]+$/, 'original.jpg');

        $(manager.$form.find(TEMPLATE_SELECTORS.INPUT)).val(newFullsizeImgUrl);

        // Submit
        return true;
      } else {
        return true;
      }

    },

    /**
     * Enables/disables form submit button state and
     * updates the button text accordingly
     * @param  {Bool} isEnabled Btn state
     * @return {undefined}
     */
    changeSubmitBtnState: function (isEnabled) {

      var $btn = this.$submit;

      if (isEnabled) {
        $btn.removeAttr('disabled').val(this.submitValue);
      } else {
        $btn.attr('disabled', 'true').val(TEXTS.UPLOADING);
      }
    },

    // Binds events to dom elements
    addEventHandlers: function () {

      var manager = this;

      this.$form.on('submit', $.proxy(this.formPreSubmit, this));

      $('.' + DJP_CLASSNAMES.FILE_INPUT).on('change', $.proxy(this.newImageLoaded, this));

      $('.' + DJP_CLASSNAMES.REMOVE_BTN.replace(/\s/g, '.')).on('click', $.proxy(this.removeImg, this));
    },

    // Event when custom file input field gets a new file.
    // What happens:
    // - Read image / Create fake dom img obj
    // - If preview is enabled for the field, append img obj to dom tree
    // - Call impressor to do necessary cropping / resizing according to the spec set for the field
    // - Upload original image to S3
    // - Upload returned blobs from impressor to S3
    // - All uploaded files get an additional `_temp` to their filenames to avoid cornflakes
    newImageLoaded: function (ev) {
      var manager = this,
        imageField = ev.target,
        imageFile = imageField.files[0],
        // Input field generated by server template
        $templateInput = $(imageField).closest('form').find(TEMPLATE_SELECTORS.INPUT),
        fieldName = $templateInput.attr('id').replace('id_', ''),
        isPreviewEnabled = $templateInput.data('enable-preview');

      if (imageField.files && imageFile) {

        var reader = new FileReader();

        reader.onload = function (readerEv) {

          var img = new Image(),
            imgBase64 = readerEv.target.result;

          img.onload = function () {
            // Get spec sizes
            var spec = $templateInput.data('spec');
            var sizes = fbm_image_specs[spec].sizes;
            var destination = fbm_image_specs[spec].destination.replace(
              '{object_identifier}', object_identifier).replace(
              '{field_name}', fieldName
            );

            // Save img base path for future use on form save
            manager.newImgUrl = destination;

            // Disable form submit btn
            manager.changeSubmitBtnState(false);

            Impressor(img, sizes, function (imgCollection) {

              // Upload original image first
              var original_temp_file_name = destination + 'original_temp.jpg';

              //TODO Update script to save images only on SUBMIT event instead of upload
              manager.uploadToS3(
                imageFile,
                imageFile.type,
                original_temp_file_name
              );

              imgCollection.forEach(function (customSizeImg) {
                // upload generated blobs
                var obj_temp_file_name = destination + customSizeImg.name + '_temp.jpg';
                manager.uploadToS3(
                  customSizeImg.blob,
                  'image/jpeg',
                  obj_temp_file_name
                );
              })
            });

            // Disable form submit btn
            manager.changeSubmitBtnState(true);

          }

          img.src = imgBase64;

          // Update the image preview
          // Previews are available on client website only
          if (isPreviewEnabled) {

            manager.updateModuleElOnUpload(ev, imgBase64);
          }
        }

        reader.readAsDataURL(imageFile);
      }
    },
  };

  /**
   * Orchestrate script execution
   */
  if (!imageFieldManager.checkPrerequisites()) {

    return new Error('Djpressor: Execution aborted.');
  } else {

    // Start Djpressor
    imageFieldManager.init();

    imageFieldManager.addUploadModuleEl();

    imageFieldManager.setupAWSBackend();

    imageFieldManager.addEventHandlers();
  }
};

/**
 * Initialize the module
 */
properWindowOnload(djpressor);
