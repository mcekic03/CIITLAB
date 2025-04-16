document.addEventListener('DOMContentLoaded', function () {
  const modal = document.getElementById('blogModal');
  const createPostBtn = document.getElementById('createPostBtn');
  const closeModalBtn = document.querySelector('.close-modal');
  const blogForm = document.getElementById('blogForm');
  const imageUpload = document.getElementById('blogImage');
  const imagePreview = document.getElementById('imagePreview');
  const uploadText = document.querySelector('.upload-text');
  const saveDraftBtn = document.getElementById('saveDraft');

  // Check user role and show/hide create post button
  function checkUserRole() {
    // This would typically come from your authentication system
   
   
    const user = JSON.parse(sessionStorage.getItem('user')); // Example: 'student', 'researcher', 'admin', 'guest'

    if (user.role === 'student' || user.role === 'researcher' && user.role != null) {
      createPostBtn.style.display = 'block';
    } else {
      createPostBtn.style.display = 'none';
    }
  }

  // Initialize role check
  checkUserRole();

  // Initialize TinyMCE
  tinymce.init({
    selector: '#blogContent',
    plugins: 'image media link lists code table',
    toolbar:
      'undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link image media | code',
    height: 400,
    image_title: true,
    automatic_uploads: true,
    file_picker_types: 'image',
    images_upload_url: '/upload', // Replace with your actual upload endpoint
    images_upload_handler: function (blobInfo, progress) {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', blobInfo.blob(), blobInfo.filename());

        fetch('/upload', {
          method: 'POST',
          body: formData,
        })
          .then((response) => response.json())
          .then((result) => {
            resolve(result.location);
          })
          .catch((error) => {
            reject('Image upload failed: ' + error);
          });
      });
    },
    setup: function (editor) {
      editor.on('init', function () {
        // Set initial content if needed
        editor.setContent('');
      });
    },
  });

  // Open modal with role check
  createPostBtn.addEventListener('click', () => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (user.role === 'student' || user.role === 'researcher') {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      tinymce.get('blogContent').setContent('');
    } else {
      alert('You do not have permission to create blog posts.');
    }
  });

  // Close modal
  closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  });

  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  // Handle image upload preview
  imageUpload.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        imagePreview.src = e.target.result;
        imagePreview.style.display = 'block';
        uploadText.style.display = 'none';
      };
      reader.readAsDataURL(file);
    }
  });

  // Handle form submission with role check
  blogForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'student' && userRole !== 'researcher') {
      alert('You do not have permission to create blog posts.');
      return;
    }

    // Get form data
    const formData = new FormData(this);
    const blogData = {
      title: formData.get('title'),
      category: formData.get('category'),
      content: tinymce.get('blogContent').getContent(),
      excerpt: formData.get('excerpt'),
      image: formData.get('image'),
      status: 'published',
      authorRole: userRole,
    };

    // Here you would typically send the data to your backend
    console.log('Publishing blog post:', blogData);

    // Close modal and reset form
    modal.classList.remove('active');
    document.body.style.overflow = '';
    this.reset();
    imagePreview.style.display = 'none';
    uploadText.style.display = 'block';
    tinymce.get('blogContent').setContent('');
  });

  // Handle save as draft with role check
  saveDraftBtn.addEventListener('click', function () {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'student' && userRole !== 'researcher') {
      alert('You do not have permission to create blog posts.');
      return;
    }

    const formData = new FormData(blogForm);
    const blogData = {
      title: formData.get('title'),
      category: formData.get('category'),
      content: tinymce.get('blogContent').getContent(),
      excerpt: formData.get('excerpt'),
      image: formData.get('image'),
      status: 'draft',
      authorRole: userRole,
    };

    // Here you would typically send the data to your backend
    console.log('Saving as draft:', blogData);

    // Close modal and reset form
    modal.classList.remove('active');
    document.body.style.overflow = '';
    blogForm.reset();
    imagePreview.style.display = 'none';
    uploadText.style.display = 'block';
    tinymce.get('blogContent').setContent('');
  });
});
