

document.addEventListener('DOMContentLoaded', function() {
  const customSelect = document.querySelector('.custom-select');
  const select = document.querySelector('#custom-combo-box');
  const optionsWrapper = document.createElement('div');
  optionsWrapper.classList.add('custom-options');
  customSelect.appendChild(optionsWrapper);

  // Add options to the custom select
  Array.from(select.options).forEach(option => {
    if (option.value) {
      const optionElement = document.createElement('div');
      optionElement.classList.add('custom-option');
      optionElement.textContent = option.textContent;
      optionElement.dataset.value = option.value;
      optionElement.addEventListener('click', function() {
        select.value = optionElement.dataset.value;
        customSelect.querySelector('.select-selected').textContent = optionElement.textContent;
        optionsWrapper.classList.remove('open');
        customSelect.classList.remove('open');
      });
      optionsWrapper.appendChild(optionElement);
    }
  });

  // Toggle options display
  customSelect.addEventListener('click', function(event) {
    event.stopPropagation(); // Prevents the event from bubbling up to the document
    optionsWrapper.classList.toggle('open');
    customSelect.classList.toggle('open');
  });

  // Close options if clicked outside
  document.addEventListener('click', function() {
    optionsWrapper.classList.remove('open');
    customSelect.classList.remove('open');
  });
});
