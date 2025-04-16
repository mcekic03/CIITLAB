

document.addEventListener('DOMContentLoaded', async function () {
  // Get the blog post ID from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');

  // Elements
  const blogTitle = document.getElementById('blogTitle');
  const blogGrid = document.getElementById('newsGrid');
  const blogCategory = document.getElementById('blogCategory');
  const blogDate = document.getElementById('blogDate');
  const blogAuthor = document.getElementById('blogAuthor');
  const blogAuthorRole = document.getElementById('blogAuthorRole');
  const blogImage = document.getElementById('blogImage');
  const blogContent = document.getElementById('blogContent');
  const blogTags = document.getElementById('blogTags');
  const relatedPosts = document.getElementById('relatedPosts');
  const editPostBtn = document.getElementById('editPostBtn');
  const deletePostBtn = document.getElementById('deletePostBtn');
  const commentText = document.getElementById('commentText');
  const submitComment = document.getElementById('submitComment');
  const commentsList = document.getElementById('commentsList');

  async function loadBlogPost(blogId) {
    // In real application, this would be an API call:
    // const response = await fetch(`/api/posts/${postId}`);
    // const post = await response.json();
    const response = await fetch(`${API_BASE_URL}/blogs/getBlog/${blogId}`);
    const blog = await response.json();

    // Update the page with blog post data
    blogTitle.textContent = blog.title;
    blogCategory.textContent = blog.category;
    blogDate.textContent = blog.date;
    blogAuthor.textContent = `By ${blog.firstName} ${blog.lastName}`;
    blogImage.src = blog.banerUrl;
    blogContent.innerHTML = blog.content;
    blogAuthorRole.textContent = blog.bio;
    const keywords = blog.keywords;
    blogTags.innerHTML = keywords
      .split(',')
      .map((keyword) => `<a href="#" class="blog-tag">${keyword}</a>`)
      .join('');
    console.log(blog);
    console.log(blog.title);

    relatedPosts.innerHTML = '';
    // Check if user is the author and show edit/delete buttons
    const currentUser = JSON.parse(localStorage.getItem('user'));
    console.log(currentUser, currentUser.name, blog.author);
    if (currentUser && currentUser.name === blog.author) {
      editPostBtn.style.display = 'block';
      deletePostBtn.style.display = 'block';
    }
  }

  // Load comments - should be async because in real app it would fetch from API
  async function loadComments(comments) {
    try {
      // In real application, this would be an API call:
      // const response = await fetch(`/api/posts/${postId}/comments`);
      // const comments = await response.json();

      commentsList.innerHTML = '';
      comments.forEach((comment) => {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        commentElement.innerHTML = `
            <div class="comment-header">
                <span class="comment-author">${comment.author}</span>
                <span class="comment-date">${comment.date}</span>
            </div>
            <div class="comment-content">${comment.content}</div>
        `;
        commentsList.appendChild(commentElement);
      });
    } catch (error) {
      console.error('Error loading comments:', error);
      // Handle error appropriately
    }
  }

  // Handle comment submission - should be async because it will send data to API
  submitComment.addEventListener('click', async function () {
    const commentContent = commentText.value.trim();
    if (commentContent) {
      try {
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (!currentUser) {
          alert('Please log in to post comments');
          return;
        }

        const newComment = {
          id: Date.now(),
          author: currentUser.name,
          date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          content: commentContent,
        };

        // In real application:
        // await fetch(`/api/posts/${postId}/comments`, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify(newComment)
        // });

        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        commentElement.innerHTML = `
            <div class="comment-header">
                <span class="comment-author">${newComment.author}</span>
                <span class="comment-date">${newComment.date}</span>
            </div>
            <div class="comment-content">${newComment.content}</div>
        `;
        commentsList.appendChild(commentElement);

        // Clear the comment input
        commentText.value = '';
      } catch (error) {
        console.error('Error posting comment:', error);
        alert('Failed to post comment. Please try again.');
      }
    }
  });

  // Handle edit post
  editPostBtn.addEventListener('click', function () {
    // Redirect to edit page with the post ID
    window.location.href = `edit-blog.html?id=${postId}`;
  });

  // Handle delete post - should be async because it will send delete request to API
  deletePostBtn.addEventListener('click', async function () {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        // In real application:
        // await fetch(`/api/posts/${postId}`, {
        //     method: 'DELETE'
        // });

        window.location.href = 'news.html';
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post. Please try again.');
      }
    }
  });

  // Initial load needs to be async as well
  await loadBlogPost(postId);
});
