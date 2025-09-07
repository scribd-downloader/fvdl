// CSS is included in HTML head

/*******************************
 * Configuration for Colors
 *******************************/
const formatColors = {
  greenFormats: ["17", "18", "22"],
  blueFormats: ["139", "140", "141", "249", "250", "251", "599", "600"],
  defaultColor: "#9e0cf2"
};

/*******************************
* Utility Functions
*******************************/
/**
* Get the background color based on the format itag.
* @param {string} downloadUrlItag - The itag parameter from the download URL.
* @returns {string} - The corresponding background color.
*/
function getBackgroundColor(downloadUrlItag) {
  if (formatColors.greenFormats.includes(downloadUrlItag)) {
      return "green";
  } else if (formatColors.blueFormats.includes(downloadUrlItag)) {
      return "#3800ff";
  } else {
      return formatColors.defaultColor;
  }
}

/**
* Debounce function to limit the rate at which a function can fire.
* @param {Function} func - The function to debounce.
* @param {number} wait - The delay in milliseconds.
* @returns {Function} - The debounced function.
*/
function debounce(func, wait) {
  let timeout;
  return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
* Extract video ID from a given URL (supports YouTube and Facebook).
* @param {string} url - The video URL.
* @returns {string|null} - The video ID or null if not found.
*/
// Function to get video IDs from URLs, including YouTube Shorts and Facebook Reels
function getVideoIds(url) {
  // Validate the input
  if (!url || typeof url !== 'string') {
      console.error('Invalid URL provided to getVideoId:', url);
      return null;
  }

  try {
      // Create a URL object to parse the URL
      const urlObj = new URL(url);

      // Check if the hostname belongs to YouTube
      const youtubeHosts = ['www.youtube.com', 'youtube.com', 'youtu.be'];
      if (youtubeHosts.includes(urlObj.hostname)) {
          // For youtu.be (short link), the video ID is in the pathname
          if (urlObj.hostname === 'youtu.be') {
              const videoId = urlObj.pathname.slice(1); // Remove the leading '/'
              return videoId.length === 11 ? videoId : null;
          }

          // For youtube.com URLs, look for 'v' or 'shorts' in query or pathname
          if (urlObj.hostname.includes('youtube.com')) {
              if (urlObj.pathname.startsWith('/shorts/')) {
                  // Shorts video ID is in the pathname after "/shorts/"
                  return urlObj.pathname.split('/')[2];
              }

              // Regular video URLs have 'v' as a query parameter
              const videoId = urlObj.searchParams.get('v');
              return videoId && videoId.length === 11 ? videoId : null;
          }
      }

      // Check if the hostname belongs to Facebook
      const facebookHosts = ['www.facebook.com', 'facebook.com', 'm.facebook.com', 'web.facebook.com'];
      if (facebookHosts.includes(urlObj.hostname)) {
          // For Facebook Reels, the video ID is in the pathname after "/reel/"
          if (urlObj.pathname.startsWith('/reel/')) {
              return urlObj.pathname.split('/')[2];
          }
          
          // For Facebook videos, extract video ID from various patterns
          const videoMatch = urlObj.pathname.match(/\/(?:videos?|reel)\/(\d+)/);
          if (videoMatch) {
              return videoMatch[1];
          }
      }

      console.warn('Unrecognized video URL format:', url);
      return null;
  } catch (error) {
      console.error('Error parsing URL in getVideoId:', error);
      return null;
  }
}

// Keep the old function name for backward compatibility
function getYouTubeVideoIds(url) {
  return getVideoIds(url);
}


/**
* Force browser to download a file using a dynamic URL.
* @param {string} url - The direct media URL.
* @param {string} filename - The suggested filename (optional).
*/
function forceDownload(url, filename = "video.mp4") {
  fetch(url, { method: 'HEAD' }).then(response => {
      if (!response.ok || !response.headers.get('Content-Type')?.startsWith('video/')) {
          window.open(url, '_blank'); // Fallback: open in new tab
          return;
      }

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  }).catch(() => {
      window.open(url, '_blank'); // Fallback on error
  });
}

/**
* Sanitize HTML content using DOMPurify.
* @param {string} content - The HTML content to sanitize.
* @returns {string} - The sanitized HTML.
*/
function sanitizeContent(content) {
  return DOMPurify.sanitize(content);
}

/**
* Update the inner HTML of a specified element with sanitized content.
* @param {string} elementId - The ID of the HTML element.
* @param {string} content - The content to inject.
*/
function updateElement(elementId, content) {
  const element = document.getElementById(elementId);
  if (element) {
      element.innerHTML = content;
  } else {
      console.warn(`Element with ID "${elementId}" not found.`);
  }
}

/**
* Retrieve a query parameter value by name from a URL.
* @param {string} name - The name of the parameter.
* @param {string} url - The URL to extract the parameter from.
* @returns {string} - The parameter value or an empty string if not found.
*/
function getParameterByName(name, url) {
  // Properly escape regex special characters
  name = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
  const results = regex.exec(url);
  
  if (!results) return '';
  if (!results[2]) return '';
  
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/*******************************
* AJAX Request with Retry Logic
*******************************/

/**
* Make an AJAX GET request with retry capability.
* @param {string} inputUrl - The input URL for the request.
* @param {number} retries - Number of retry attempts remaining.
*/
function makeRequest(inputUrl, retries = 1) {
  const requestUrl = `https://vkrdownloader.xyz/server?api_key=vkrdownloader&vkr=${encodeURIComponent(inputUrl)}`;
  const retryDelay = 3000; // Initial retry delay in milliseconds
  const maxRetries = retries;

  $.ajax({
      url: requestUrl,
      type: "GET",
      cache: true,
      async: true,
      crossDomain: true,
      dataType: 'json',
      timeout: 15000, // Extended timeout for slower networks
      success: function (data) {
          handleSuccessResponse(data, inputUrl);
      },
      error: function (xhr, status, error) {
          if (retries > 0) {
              let delay = retryDelay * Math.pow(2, maxRetries - retries); // Exponential backoff
              console.log(`Retrying in ${delay / 1000} seconds... (${retries} attempts left)`);
              setTimeout(() => makeRequest(inputUrl, retries - 1), delay);
          } else {
              const errorMessage = getErrorMessage(xhr, status, error);
              console.error(`Error Details: ${errorMessage}`);
              displayError("Unable to fetch the download link after several attempts. Please check the URL or try again and Click agin on Download Button or Refresh web Page.");
              document.getElementById("loading").style.display = "none";
          }
      },
      complete: function () {
          document.getElementById("downloadBtn").disabled = false; // Re-enable the button
      }
  });
}

function getErrorMessage(xhr, status, error) {
  const statusCode = xhr.status;
  let message = `Status: ${status}, Error: ${error}`;

  if (xhr.responseText) {
      try {
          const response = JSON.parse(xhr.responseText);
          if (response && response.error) {
              message += `, Server Error: ${response.error}`;
          }
      } catch (e) {
          message += `, Unable to parse server response.`;
      }
  }

  switch (statusCode) {
      case 0: return "Network Error: The server is unreachable.";
      case 400: return "Bad Request: The input URL might be incorrect.";
      case 401: return "Unauthorized: Please check the API key.";
      case 429: return "Too Many Requests: You are being rate-limited.";
      case 503: return "Service Unavailable: The server is temporarily overloaded.";
      default: return `${message}, HTTP ${statusCode}: ${xhr.statusText || error}`;
  }
}




/**
* Generate a detailed error message based on the XHR response.
* @param {Object} xhr - The XMLHttpRequest object.
* @param {string} status - The status string.
* @param {string} error - The error message.
* @returns {string} - The formatted error message.
*/

/*******************************
* Event Handlers
*******************************/

/**
* Handle the "Download" button click event.
*/
document.getElementById("downloadBtn").addEventListener("click", debounce(function () {
  document.getElementById("loading").style.display = "initial";
  document.getElementById("downloadBtn").disabled = true; // Disable the button

  const inputUrl = document.getElementById("inputUrl").value.trim();
  if (!inputUrl) {
      displayError("Please enter a valid video URL.");
      document.getElementById("loading").style.display = "none";
      document.getElementById("downloadBtn").disabled = false;
      return;
  }

  makeRequest(inputUrl); // Make the AJAX request with retry logic
}, 300));  // Adjust the delay as needed

/**
* Display an error message within the page instead of using alert.
* @param {string} message - The error message to display.
*/
function displayError(message) {
  const errorContainer = document.getElementById("error");
  if (errorContainer) {
      errorContainer.innerHTML = sanitizeContent(message);
      errorContainer.style.display = "block";
  } else {
      // Fallback to alert if error container is not available
      alert(message);
  }
}

/*******************************
* Response Handlers
*******************************/

/**
* Handle successful AJAX responses.
* @param {Object} data - The response data from the server.
* @param {string} inputUrl - The original input URL.
*/
function handleSuccessResponse(data, inputUrl) {
  document.getElementById("container").style.display = "block";
  document.getElementById("loading").style.display = "none";

  if (data.data) {
      const videoData = data.data;
      
      // Extract necessary data
      const downloadUrls = videoData.downloads.map(download => download.url);
      const videoSource = videoData.source;
      const videoId = getVideoIds(videoSource);
      const isYouTube = videoSource && (videoSource.includes('youtube.com') || videoSource.includes('youtu.be'));
      const thumbnailUrl = (isYouTube && videoId) 
  ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
  : videoData.thumbnail;
      // Construct video HTML
      const videoHtml = `
  <video style='background: black url(${thumbnailUrl}) center center/cover no-repeat; width:100%; height:500px; border-radius:20px;' 
         poster='${thumbnailUrl}' controls playsinline>
      <source src='${videoData.downloads[5]?.url || ''}' type='video/mp4'>
      ${Array.isArray(downloadUrls) ? downloadUrls.map(url => `<source src='${url}' type='video/mp4'>`).join('') : ''}
      <source src='https://vkrdownloader.xyz/server/dl.php?vkr=${encodeURIComponent(inputUrl)}' type='video/mp4'>
  </video>`;
      const YTvideoHtml = `
          <video style='background: black url(${thumbnailUrl}) center center/cover no-repeat; width:100%; height:500px; border-radius:20px;' 
                 poster='${thumbnailUrl}' controls playsinline>
               <source src='https://vkrdownloader.xyz/server/redirect.php?vkr=https://youtu.be/${videoId}' type='video/mp4'>
               <source src='https://vkrdownloader.xyz/server/dl.php?vkr=${inputUrl}' type='video/mp4'>
              ${downloadUrls.map(url => `<source src='${url}' type='video/mp4'>`).join('')}
          </video>`;
      const titleHtml = videoData.title ? `<h3>${sanitizeContent(videoData.title)}</h3>` : "";
      const descriptionHtml = videoData.description ? `<h4><details><summary>View Description</summary>${sanitizeContent(videoData.description)}</details></h4>` : "";
      const durationHtml = videoData.size ? `<h4>${sanitizeContent(videoData.size)}</h4>` : "";
      const uploaderHtml = videoData.uploader ? `<div><i class="bi bi-person-circle me-2"></i>${sanitizeContent(videoData.uploader)}</div>` : "";
      const extractorHtml = videoData.extractor ? `<div><i class="bi bi-gear me-2"></i>Extracted via: ${sanitizeContent(videoData.extractor)}</div>` : "";
      const downloadURLHtml = videoData.downloads && videoData.downloads.length > 0 ? `<div><i class="bi bi-link-45deg me-2"></i>Available formats: ${videoData.downloads.length}</div>` : "";

      // Update DOM elements
      if (isYouTube && videoId) {
          updateElement("thumb", YTvideoHtml);
      } else {
          updateElement("thumb", videoHtml);
      }
      updateElement("title", titleHtml);
      updateElement("description", descriptionHtml);
      updateElement("duration", durationHtml);
      updateElement("uploader", uploaderHtml);
      updateElement("extractor", extractorHtml);
      updateElement("downloadURL", downloadURLHtml);

      // Generate download buttons
      generateDownloadButtons(data, inputUrl);
  } else {
      displayError("Issue: Unable to retrieve the download link. Please check the URL and contact us on Social Media @TheOfficialVKr.");
      document.getElementById("loading").style.display = "none";
  }
}

/**
* Generate download buttons with dynamic colors and labels.
* @param {Object} videoData - The video data from the server.
* @param {string} inputUrl - The original input URL.
*/
function generateDownloadButtons(videoData, inputUrl) {
  const downloadContainer = document.getElementById("download");
  downloadContainer.innerHTML = "";

  if (videoData.data) {
      const downloads = videoData.data.downloads;
      const videoSource = videoData.data.source;

      // Add YouTube specific button if applicable
      const videoId = getVideoIds(videoSource);
      const isYouTube = videoSource && (videoSource.includes('youtube.com') || videoSource.includes('youtu.be'));
      if (isYouTube && videoId) {
        //  downloadContainer.innerHTML += `
        //      <a href='https://inv.nadeko.net/latest_version?id=${videoId}&itag=18&local=true' target='_blank' rel='noopener noreferrer'>
        //          <button class='dlbtns' style='background: green'>Download Video (YouTube)</button>
        //      </a>`;
          const qualities = ["mp3", "360", "720", "1080"];
          qualities.forEach(quality => {
              downloadContainer.innerHTML += `
    <iframe style="border: 0; outline: none; display:inline; min-width: 150px; max-height: 45px; height: 45px !important; margin-top: 10px; overflow: hidden;"   sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-downloads allow-downloads-without-user-activation"  scrolling="no"
     src="https://vkrdownloader.xyz/server/dlbtn.php?q=${encodeURIComponent(quality)}&vkr=${encodeURIComponent(videoSource)}">
     </iframe>`;
          });
      }
      // Generate download buttons for available formats
      downloads.forEach(download => {
          if (download && download.url) {
              const downloadUrl = download.url;
              const itag = getParameterByName("itag", downloadUrl);
              const bgColor = getBackgroundColor(itag);
              const videoExt = download.format_id;
              const videoSize = download.size;

              // Use the specified background color #3f5974 for download buttons
              const buttonColor = bgColor === formatColors.defaultColor ? "#3f5974" : bgColor;
              
              const redirectUrl = `https://vkrdownloader.xyz/forcedl?forceT=${videoData.data.title}&forceD=${encodeURIComponent(downloadUrl)}`;
              downloadContainer.innerHTML += `
<button class="dlbtns" style="background:${buttonColor}; color: white; font-weight: bold;" onclick="window.location.href='${redirectUrl}'">
  ${sanitizeContent(videoExt)} - ${sanitizeContent(videoSize)}
</button>
`;

          }
      });

  } else {
      displayError("No download links found or data structure is incorrect.");
      document.getElementById("loading").style.display = "none";
  }

  // If no download buttons or iframes were added, notify the user
  if (downloadContainer.innerHTML.trim() === "") {
      displayError("Server Down due to Too Many Requests. Please contact us on Social Media @TheOfficialVKr.");
      document.getElementById("container").style.display = "none";
      // Redirecting the user to an alternative download page
     // window.location.href = `https://vkrdownloader.xyz/download.php?vkr=${encodeURIComponent(inputUrl)}`;
  }
}
