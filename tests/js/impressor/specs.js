var fbm_image_specs = {
    // Team Member
    some_spec: {
        sizes: [{
            width: 150,
            height: 100,
            name: "thumbnail_image"
        }, {
            width: 100,
            height: 100,
            name: "square_image"
        }, {
            width: 100,
            height: 20,
            name: "nav_image"
        }],
        destination: 'some/destination/{object_identifier}/{field_name}/'
    },

    default_backend: {
        'aws_s3_bucket': 'some_bucket',
        'aws_identity_pool': 'eu-west-1:12312312-1234-1234-1234-123456789123',
        'aws_region': 'eu-west-1',
    },
}