import React, { useState, useEffect, useRef } from 'react';
import LoadingSpinner from './LoadingSpinner';
import imageCompression from 'browser-image-compression';

function Forums({ actor, currentPrincipal }) {
  const [forums, setForums] = useState([]);
  const [selectedForum, setSelectedForum] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ text: '', photos: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newForum, setNewForum] = useState({ name: '', comment: '' });
  const [updateModal, setUpdateModal] = useState(false);
  const [postToUpdate, setPostToUpdate] = useState(null);
  const [updatedPostComment, setUpdatedPostComment] = useState('');
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef();
  const clearFileInput = () => {
    setNewPost({ text: '', photos: [] }); // Reset newPost state
    if (fileInputRef.current) fileInputRef.current.value = []; // Clear file input field
  };

  const openUpdateModal = (post) => {
    setPostToUpdate(post);
    setUpdatedPostComment(post.forum_comment);
    setUpdateModal(true);
  };

  const closeUpdateModal = () => {
    setUpdateModal(false);
    setPostToUpdate(null);
    setUpdatedPostComment('');
  };


  // Handle drag and drop
  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setFiles(event.dataTransfer.files[0]);
  };

  const convertUint8ArrayToBase64 = (uint8Array) => {
    if (uint8Array && uint8Array.byteLength) {
      let binary = '';
      const len = uint8Array.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      return window.btoa(binary); 
    } else {
      console.warn("Invalid Uint8Array passed to convertUint8ArrayToBase64");
      return ''; 
    }
  };


  const compressImage = async (file) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };
    try {
      const compressedFile = await imageCompression(file, options);
      const arrayBuffer = await compressedFile.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      console.error("Error compressing image:", error);
      return null;
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files).slice(0, 5); // Limit to 5 photos
    const compressedPhotos = await Promise.all(
      files.map((file) => compressImage(file))
    );

    setNewPost((prev) => ({
      ...prev,
      photos: [...prev.photos, ...compressedPhotos.filter((photo) => photo !== null)],
    }));
  };
  



  useEffect(() => {
    fetchForums();
  }, [actor, searchTerm, page]);

  const fetchForums = async () => {
    setLoading(true);
    try {
      const [forumList, totalCount] = await actor.get_forums(searchTerm, page);
      setForums(
        forumList.map((forum) => ({
          ...forum,
          created_at: forum.created_at ? Number(forum.created_at) : null,
          threads: Array.isArray(forum.threads) ? forum.threads : [],
        }))
      );
      setTotalPages(Math.ceil(totalCount / 15));
    } catch (error) {
      console.error('Error fetching forums:', error);
      alert('Failed to fetch forums. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async (forumId) => {
    setLoading(true);
    try {
      const [forumPosts] = await actor.get_forum_posts(forumId, 0);
      setPosts(forumPosts);
    } finally {
      setLoading(false);
    }
  };

  const handleAddForum = async () => {
    if (newForum.name.trim() && newForum.comment.trim()) {
      setLoading(true);
      const profile = await actor.authentication(currentPrincipal);
      const username = Array.isArray(profile) && profile.length > 0 ? profile[0].username : profile.username;

      if (!username) {
        alert('You need to have a profile to add a forum.');
        return;
      }

      try {
        const success = await actor.add_forum(
          currentPrincipal,
          username,
          newForum.name,
          newForum.comment
        );

        if (success) {
          setNewForum({ name: '', comment: '' });
          setShowModal(false);
          fetchForums();
        } else {
          alert('Failed to add forum.');
        }
      } finally {
        setLoading(false);
      }
    }
  };



  const handleAddPost = async () => {
    if (!newPost.text.trim() || !selectedForum) {
      alert('Cannot add a post. Ensure you have entered a post and selected a forum.');
      return;
    }

    setLoading(true);
    const profile = await actor.authentication(currentPrincipal);
    const username = Array.isArray(profile) && profile.length > 0 ? profile[0].username : profile.username;

    if (!username) {
      alert('You need to have a profile to add a post.');
      return;
    }

    try {
      const compressedFilesBase64 = await Promise.all(
        files.map(async (file) => {
          const compressedFile = await compressImage(file);
          return convertUint8ArrayToBase64(compressedFile);
        })
      );

      const success = await actor.add_post_to_forum(
        selectedForum.id,
        username,
        currentPrincipal,
        newPost.text,
        newPost.photos
      );

      if (success) {
        setNewPost({ text: '', photos: [] });
        clearFileInput();
        fetchPosts(selectedForum.id);
      } else {
        alert('Failed to add post.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForumClick = (forum) => {
    setSelectedForum(forum);
    fetchPosts(forum.id);
  };

  const handleDeleteForum = async (forumId) => {
    if (!window.confirm('Are you sure you want to delete this forum?')) return;
    setLoading(true);
    try {
      const success = await actor.delete_forum(forumId, currentPrincipal);
      if (success) {
        alert('Forum deleted successfully!');
        setSelectedForum(null);
        fetchForums();
      } else {
        alert('Failed to delete forum.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    setLoading(true);
    try {
      const success = await actor.delete_post(postId, currentPrincipal);
      if (success) {
        alert('Post deleted successfully!');
        fetchPosts(selectedForum.id);
      } else {
        alert('Failed to delete post.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePost = async () => {
    if (!updatedPostComment.trim() || !postToUpdate) {
      alert('Cannot update the post. Ensure you have entered a comment.');
      return;
    }

    setLoading(true);
    const profile = await actor.authentication(currentPrincipal);
    const username = Array.isArray(profile) && profile.length > 0 ? profile[0].username : profile.username;

    try {
      const success = await actor.update_forum_post(
        postToUpdate.id,
        username,
        currentPrincipal,
        updatedPostComment,
        []
      );

      if (success) {
        alert('Post updated successfully!');
        fetchPosts(selectedForum.id);
        closeUpdateModal();
      } else {
        alert('Failed to update the post.');
      }
    } finally {
      setLoading(false);
    }
  };
     
    

  return (
      <div
        className="forums-container"
        onClick={(e) => {
          // Check if the click is outside the forum-selected container
          if (
            selectedForum &&
            !e.target.closest('.forum-selected-container') &&
            !e.target.closest('.forum-card')
          ) {
            setSelectedForum(null); // Clear selected forum
          }
        }}
      >
        <h1>Forums</h1>
    
        {/* Loading Spinner */}
        {loading && <LoadingSpinner />}
    
        {/* Search Bar */}
        <div className="search-bar-forum">
          <input
            type="text"
            placeholder="Search forums..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
    
        <button
          className="add-new-forum"
          onClick={(e) => {
            e.stopPropagation(); // Prevent bubbling to container click
            setShowModal(true);
          }}
        >
          Add Forum
        </button>
    
        {/* Forums List */}
        {!selectedForum ? (
          <div className="forum-list">
            {forums.map((forum) => (
              <div
                key={forum.id}
                className="forum-card"
                onClick={() => handleForumClick(forum)}
              >
                <h3>{forum.forum_name}</h3>
                <p>{forum.forum_comment}</p>
                <p>Added By: {forum.username}</p>
                <p>
                  Created at:{' '}
                  {forum.created_at
                    ? new Date(Number(forum.created_at) / 1_000_000).toLocaleString()
                    : 'Unknown'}
                </p>
                {forum.poster_principal === currentPrincipal && (
                  <button
                    className="delete-forum-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteForum(forum.id);
                    }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="forum-selected-container">
            {/* Sidebar */}
            <div className="forum-list sidebar">
              {forums.map((forum) => (
                <div
                  key={forum.id}
                  className={`forum-card ${
                    forum.id === selectedForum.id ? 'selected' : ''
                  }`}
                  onClick={() => handleForumClick(forum)}
                >
                  <h3>{forum.forum_name}</h3>
                </div>
              ))}
            </div>
    
            {/* Selected Forum */}
            <div className="forum-selected">
              <button
                className="close-player-button"
                style={{
                  position: "relative",
                  bottom: "100%",
                  left: "95%",
                  background: "rgb(28, 73, 73)",
                  color: "white",
                  borderRadius: "5px",
                  padding: "8px 12px",
                  fontSize: "20px",
                  cursor: "pointer",
                  border: "2px solid #58b0d2",
                  boxhadow: "4px 8px #86e3e6"
                }}
                
                onClick={(e) => {
                  e.stopPropagation(); // Prevent bubbling to container click
                  setSelectedForum(null);
                }}
              >
                ✖
              </button>
              <h2>{selectedForum.forum_name}</h2>
              <p>{selectedForum.forum_comment}</p>
              <p>Added By: {selectedForum.username}</p>
              <p>
                Created at:{' '}
                {selectedForum.created_at
                  ? new Date(Number(selectedForum.created_at) / 1_000_000).toLocaleString()
                  : 'Unknown'}
              </p>
    
              {/* Posts Section */}
              <div className="forum-posts">
                <h3>Posts/Reply</h3>
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <div key={post.id} className="forum-post">
                      <p>
                        <strong>{post.forum_comment}</strong>
                      </p>
                      <p>Added By: {post.username}</p>
                      <p>
                        Created at:{' '}
                        {post.created_at
                          ? new Date(Number(post.created_at) / 1_000_000).toLocaleString()
                          : 'Unknown'}
                      </p>
    
                      {/* Post Photos */}
                      <div className="post-image-container">
                        {post.photos && post.photos.length > 0 ? (
                          post.photos.map((photo, index) => (
                            <img
                              key={index}
                              src={`data:image/png;base64,${convertUint8ArrayToBase64(photo)}`}
                              alt={`post ${index + 1}`}
                              className="instrument-photo"
                              style={{ width: '100px', height: '100px', margin: '5px' }}
                            />
                          ))
                        ) : (
                          <div className="no-image-placeholder"></div>
                        )}
                      </div>
    
                      {/* Delete Button */}
                      {post.principal === currentPrincipal && (
                        <button
                          className="delete-forum-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePost(post.id);
                          }}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p>No posts available for this forum.</p>
                )}
              </div>
    
    
    

            {/* Add Post Section */}
            <div className="add-post">
              <textarea
                placeholder="Add a post..."
                value={newPost.text}
                rows={6}
                onChange={(e) =>
                  setNewPost((prev) => ({ ...prev, text: e.target.value }))
                }
              />
  
              <label style={{ marginTop: '10px' }}>Upload optional picture:</label>
              <div
                className="upload-box"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {files.length > 0 ? (
                  <>
                    {files.map((file, index) => (
                      <p key={index}>{file.name}</p>
                    ))}
                    <button onClick={clearFileInput} className="clear-file-button">
                      Clear Files
                    </button>
                  </>
                ) : (
                  <>
                    <p>Drop here or...</p>
                    <input
                      id="file-input"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                    />
                  </>
                )}
              </div>
  
              <button className="add-new-forum" onClick={handleAddPost}>Add Post</button>
            </div>
          </div>
        </div>
      )}
  
      {/* Update Modal */}
      {updateModal && (
        <div className="modal">
          <div className="modal-content">
            <span onClick={closeUpdateModal}>&times;</span>
            <h2>Update Post</h2>
            <textarea
              placeholder="Update your post..."
              value={updatedPostComment}
              onChange={(e) => setUpdatedPostComment(e.target.value)}
            />
            <button onClick={handleUpdatePost}>Update</button>
          </div>
        </div>
      )}
  
      {/* Add Forum Modal */}
      {showModal && (
        <div className="modal-forum">
          <div className="modal-content-forum">

            <span className="close-button" onClick={() => setShowModal(false)}>&times;</span>

            <h2>Add New Forum</h2>
            <input
              type="text"
              placeholder="Forum Name"
              value={newForum.name}
              onChange={(e) =>
                setNewForum((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <textarea
              placeholder="Forum Comment"
              value={newForum.comment}
              rows={7}
              onChange={(e) =>
                setNewForum((prev) => ({ ...prev, comment: e.target.value }))
              }
            />
            <button onClick={handleAddForum}>Add Forum</button>
          </div>
        </div>
      )}
    </div>
  );  
}

export default Forums;
