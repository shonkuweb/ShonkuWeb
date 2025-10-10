
document.getElementById('contactForm').addEventListener('submit', function(e){
  e.preventDefault(); // prevent default form submission

  const form = e.target;
  const data = new FormData(form);

  fetch(form.action, {
    method: 'POST',
    body: data,
    headers: {
      'Accept': 'application/json'
    }
  })
  .then(response => {
    if (response.ok) {
      form.style.display = 'none';           // hide the form
      document.getElementById('successMessage').style.display = 'block'; // show success message
    } else {
      alert('Oops! There was a problem submitting your form.');
    }
  })
  .catch(error => {
    console.error(error);
    alert('Oops! There was a problem submitting your form.');
  });
});