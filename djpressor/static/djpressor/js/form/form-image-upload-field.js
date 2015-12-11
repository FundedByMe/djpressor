'use strict';
(function(){
    var imageFieldManager = {
        init: function(){
            // Vars

            // Main form.
            // This is a bit of an awkward way to load the form, but to avoid
            // setting new custom classes on forms alredy avaialble in the project
            // we'll just do it this way.
            this.form = $('input[data-s3-enabled="enabled"]').closest('form');
            this.formCanSubmit = true; // Initially, users can submit the form immediately
            this.submitButton = this.form.find(':submit:first');  // Submit button will be disabled while upload is taking place

            this.original_submit_val = this.submitButton.val();

            this.preview_class = 'image_field_preview';  // Class that'll be given to preview box attached right after the input field.
            this.preview_box_style = {'width': '100px',
                                      'position': 'absolute',
                                      'right': '0px',
                                      'top': '0px'}

            // Init an empty list for uploaded images.

            this.uploaded = [];

            // Make sure specs are loaded.
            if (typeof(fbm_image_specs) === 'undefined') {
                throw new Error('Specs not loaded (or malformed). Image processing will fail.');
            };

            if (typeof(object_identifier) === 'undefined') {
                throw new Error('"object_identifier" not set. Image upload will fail.');
            };

        },

        initFileInputFields: function(){
            var manager = this;

            $.each(this.form.find('input[data-s3-enabled="enabled"]'), function(){
                var $orig_elem = $(this);
                // Create fake file input orig_elem
                var $file_elem = $('<input />')
                    .attr('type', 'file')
                    .attr('id', $orig_elem.attr('id'))
                    .attr('value', '')

                // Change ID of orig_elem so we don't end up with duplicate ids
                $orig_elem.attr('id', 'original-' + $orig_elem.attr('id'));

                // Copy data attrs to new fake file input orig_elem
                var attrs = $orig_elem.prop("attributes");

                var attrsToRemove = [];
                $.each(attrs, function(index, attr) {
                    if (attr.name.substring(0, 5) == 'data-'){
                        $file_elem.attr(attr.name, attr.value);
                        attrsToRemove.push(attr.name);
                    }
                });

                // Load up preview box
                if (attrs.hasOwnProperty('value')){
                    $file_elem.css({'width': '95px'});

                    // if preview is enabled on field, load up the preview

                    if($orig_elem.data('enable-preview')){

                        var img = new Image;
                        img.src = attrs['value'].value;

                        var preview_img = $(img).css(manager.preview_box_style);
                        $(preview_img).addClass(manager.preview_class);
                        
                        $(preview_img).addClass('preview-for-' + $file_elem.attr('id'));
                    };
                }

                // Remove them from original element so jquery doesn't get confused.
                $.each(attrsToRemove, function() {
                    $orig_elem.removeAttr(this);
                });

                // Add file_elem in the orig_elem's place (or actually, right after)
                $('#' + $(this).attr('id')).after($file_elem);

                if (attrs.hasOwnProperty('value')){
                    if($orig_elem.data('enable-preview')){
                        // Remove prev preview imgs if any and add the new one
                        $('.' + manager.preview_class + '.preview-for-' + $file_elem.attr('id')).remove();
                        $file_elem.after(preview_img);
                    }
                }

                // CSS hack to make our special FBM form field container label not show up above the input
                $('#' + $(this).attr('id')).parent('.formField').addClass('is-floating')

                // Add clear image button
                var reset_image_func = function(e){
                    e.preventDefault();
                    $orig_elem.attr('value', '');
                }

                var $reset_image_link = $('<a>')
                    .css({'display': 'block'})
                    .attr('href', 'javascript:;').text('Clear');

                $reset_image_link.bind('click', reset_image_func);
                $file_elem.after($reset_image_link);

                // TODO: Make initFileInputFields nicer!
            });
        },

        setupAWSBackend: function(){

            // Temp way to load backend. TODO: Make me better.
            var backend = fbm_image_specs['default_backend'];

            this.bucket_name = backend.aws_s3_bucket;
            this.region = backend.aws_region;

            // Setup AWS Creds
            var creds = new AWS.CognitoIdentityCredentials({
                // AWS Cognito Identity Pool ID
                IdentityPoolId: backend.aws_identity_pool,
            });

            // Configure AWS credential
            AWS.config.credentials = creds;

            // Configure region
            AWS.config.region = this.region;

            this.aws_bucket = new AWS.S3({params: {Bucket: this.bucket_name}});
        },

        // Uploads images to S3 destination before main form submit
        formPreSubmit: function(e){
            var manager = this;
            // Create hidden input fields for
            // each of the uploaded files so they get submitted
            // along with the form
            if (manager.formCanSubmit){
                var any_file;

                this.uploaded.forEach(function(file){
                    var name = file.split('/')[file.split('/').length-1].replace(
                        '_temp.jpg', ''  // Get rid of '_temp.jpg' part for hidden field name
                    );

                    $('<input />').attr('type', 'hidden')
                        .attr('name', name)
                        .attr('value', file)
                    .prependTo(manager.form);

                    if (typeof(any_file) == "undefined"){
                        any_file = file;
                    };
                });

                // Remove file input so file doesn't get submitted to form, wasting memory
                // and set the value to the original.jpg file
                var original_image_url = any_file.replace(
                    any_file.split('/')[any_file.split('/').length-1],
                    "original.jpg"
                );

                $(manager.form.find('input[data-s3-enabled="enabled"]')).val('');

                var field_id = $(manager.form.find('input[data-s3-enabled="enabled"]')).attr('id');
                $('#original-' + field_id).val(original_image_url);
                // Submit
                return true;
            }else{
                e.preventDefault();
                return false;
            };

        },

        // Binds events to dom elements
        bind: function(){
            // Get a copy of this
            var manager=this;

            // Bind file input fileds change event to preview image before upload.
            this.form.find('input[data-s3-enabled="enabled"]').on(
                'change',
                $.proxy(manager.newImageLoaded, this)
            );

            // Bind form submit event to form presubmit func
            this.form.on(
                'submit',
                $.proxy(manager.formPreSubmit, this)
            );
        },

        // Event when custom file input field gets a new file.
        // What happens:
        // - Read image / Create fake dom img obj
        // - If preview is enabled for the field, append img obj to dom tree
        // - Call impressor to do necessary cropping / resizing according to the spec set for the field
        // - Upload original image to S3
        // - Upload returned blobs from impressor to S3
        // - All uploaded files get an additional `_temp` to their filenames to avoid cornflakes
        newImageLoaded: function(e){
            var manager = this;
            var imageField = e.target;
            var previewEnabled = $(imageField).data('enable-preview');
            var previewDestination =  $(imageField).data('preview-to');

            var fieldName = $(imageField).attr('id').replace('id_', '');
            var imageFile = imageField.files[0];

            if (imageField.files && imageFile) {

                var reader = new FileReader();

                reader.onload = function (e) {
                    var image_b64 = e.target.result;
                    var img = new Image;

                    img.onload = function (){
                        // Get spec sizes
                        var spec = $(imageField).data('spec');
                        var sizes = fbm_image_specs[spec].sizes;
                        var destination = fbm_image_specs[spec].destination.replace(
                            '{object_identifier}', object_identifier).replace(
                            '{field_name}', fieldName
                        );

                        Impressor(img, sizes, function (returned) {
                            // Upload original image first
                            var original_temp_file_name = destination + 'original_temp.jpg';

                            manager.uploadToS3(
                                imageFile,
                                imageFile.type,
                                original_temp_file_name
                            );

                            returned.forEach(function(processedImg) {
                                // upload generated blobs
                                var obj_temp_file_name = destination + processedImg.name + '_temp.jpg';
                                manager.uploadToS3(
                                    processedImg.blob,
                                    'image/jpeg',
                                    obj_temp_file_name
                                );
                            })
                        });
                    }

                    img.src = image_b64;

                    if (previewEnabled){
                        var preview_img = $(img).css(manager.preview_box_style);

                        $(preview_img).addClass(manager.preview_class);

                        $(preview_img).addClass('preview-for-' + $(imageField).attr('id'));

                        $('.' + manager.preview_class + '.preview-for-' + $(imageField).attr('id')).remove(); // Remove prev preview imgs

                        $(imageField).after(preview_img);
                    }
                }

                reader.readAsDataURL(imageField.files[0]);
            }
        },

        // Function that uploads a single blob to S3 bucket destination
        uploadToS3: function(source, content_type, key_name){
            var manager = this;
            var params = {
                Key: key_name,
                ContentType: content_type,
                Body: source,
                ACL: 'public-read'
            };

            // disable form submission until stuff get uploaded
            manager.formCanSubmit = false;

            manager.submitButton.val('Loading...');

            this.aws_bucket.upload(params, function (err, data) {
                if (!err){
                    manager.uploaded.push(data.Location);
                };

                // Regardless, always enable form submission back
                manager.formCanSubmit = true;

                manager.submitButton.val(manager.original_submit_val);
            });
        },
    }

    // Init vars
    imageFieldManager.init();

    // Init input fields
    imageFieldManager.initFileInputFields();

    // Setup AWS backend
    imageFieldManager.setupAWSBackend();

    // Bind events
    imageFieldManager.bind();
})();