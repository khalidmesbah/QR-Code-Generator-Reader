/* variables */
const form = document.getElementById(`form`);
const spinner = document.getElementById(`spinner`);
const urlEl = document.getElementById(`text`);
const result = document.getElementById(`qrcode`);
const modalBtn = document.getElementById(`modal-btn`);
const customColorsBtn = document.getElementById(`custom-colors`);
const colorsGroup = document.getElementById(`colors-group`);
const inputFile = document.getElementById(`upload`);
const dropArea = document.querySelector(`.info`);
const scannedImg = document.getElementById(`scanned-image`);
const laserScan = document.getElementById(`laser-scan`);
const scanResult = document.getElementById(`result`);
const copyBtn = document.getElementById(`copy`);
/* functions */
const showSpinner = (spinner) => spinner.classList.remove(`d-none`);
const hideSpinner = (spinner) => spinner.classList.add(`d-none`);
const showLaser = (laser) => laser.classList.add(`active`);
const hideLaser = (laser) => laser.classList.remove(`active`);
const enableModalBtn = (btn) => btn.removeAttribute(`disabled`);
const disableModalBtn = (btn) => btn.setAttribute(`disabled`, ``);
const showModal = () => modalBtn.click();
const reset = (element) => (element.innerHTML = "");
const validateUrlEl = (urlEl) => (urlEl.className = `is-valid form-control`);
const unValidateUrlEl = (urlEl) =>
  (urlEl.className = `is-invalid form-control`);
const generateRandomNumbers = (size, max) => {
  const randomNumbers = new Set();
  if (max < size) throw new Error(`the max must be bigger than the size`);
  while (randomNumbers.size < size)
    randomNumbers.add(Math.ceil(Math.random() * max));
  return [...randomNumbers].join("");
};
const getComplementHexColor = (hex) => {
  hex = hex.slice(1);
  const hexSystem = `fedcba9876543210`;
  let complementHex = `#`;
  for (let i = 0; i < hex.length; i++) {
    complementHex +=
      hexSystem[hexSystem.length - 1 - hexSystem.indexOf(hex[i])];
  }
  return complementHex;
};
const createSaveBtn = (downloadUrl) => {
  const link = document.createElement(`a`);
  link.className = `btn btn-primary mt-1`;
  link.href = downloadUrl;
  link.download = `qrcode-${generateRandomNumbers(30, 100)}`;
  const text = document.createTextNode(`Download`);
  link.appendChild(text);
  const modalFooter = document.getElementById(`modal-footer`);
  reset(modalFooter);
  modalFooter.appendChild(link);
};
const highlight = () => dropArea.classList.add("active");
const unHighlight = () => dropArea.classList.remove("active");
const getData = () => ({
  text: document.getElementById(`text`).value,
  size: document.getElementById(`size`).value,
  primaryClr: customColorsBtn.checked
    ? document.getElementById(`primary-color`).value
    : `#000000`,
  secondaryClr: customColorsBtn.checked
    ? document.getElementById(`secondary-color`).value
    : `#ffffff`,
});
const generateQrCode = ({ text, size, primaryClr, secondaryClr }) => {
  if (primaryClr === secondaryClr)
    secondaryClr = getComplementHexColor(secondaryClr);
  try {
    const qrCode = new QRCode(document.getElementById(`qrcode`), {
      text: text,
      width: size,
      height: size,
      colorDark: primaryClr,
      colorLight: secondaryClr,
      correctLevel: QRCode.CorrectLevel.H,
    });
    setTimeout(() => {
      createSaveBtn(qrCode._el.querySelector(`img`).src);
    }, 50);
  } catch {
    throw new Error(`Can't generate the QR code`);
  }
};
const scan = (file) => {
  if (!file.type.startsWith(`image`)) {
    alert(`Only images are available`);
    return;
  }
  const src = URL.createObjectURL(file);
  scannedImg.src = src;
  scannedImg.onload = () => URL.revokeObjectURL(scannedImg.src); // free memory
  const formData = new FormData();
  formData.append(`file`, file);
  fetchRequest(formData);
};
const toggleColorGroup = () => {
  if (customColorsBtn.checked) {
    [...colorsGroup.children].forEach((child) => {
      child.classList.remove(`opacity-50`);
      child.querySelector(`input`).removeAttribute(`disabled`);
    });
  } else {
    [...colorsGroup.children].forEach((child) => {
      child.classList.add(`opacity-50`);
      child.querySelector(`input`).setAttribute(`disabled`, ``);
    });
  }
};
const copyToClipboard = (text) => {
  const el = document.createElement(`textarea`);
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
};
const fetchRequest = async (formData) => {
  scanResult.value = `Scanning QR Code...`;
  const response = await fetch(`https://api.qrserver.com/v1/read-qr-code/`, {
    method: `POST`,
    body: formData,
  });
  let result = await response.json();
  result = result[0].symbol[0].data;
  showLaser(laserScan);
  setTimeout(() => {
    scanResult.value = result || `Couldn't Scan The QR Code`;
    hideLaser(laserScan);
  }, 2000);
};
/* event listeners */
form.addEventListener(`submit`, (e) => {
  e.preventDefault();
  const data = getData();
  if (!form.checkValidity() || data.text.trim() === "") {
    unValidateUrlEl(urlEl);
    disableModalBtn(modalBtn);
  } else {
    showSpinner(spinner);
    enableModalBtn(modalBtn);
    showModal();
    reset(result);
    validateUrlEl(urlEl);
    setTimeout(() => {
      hideSpinner(spinner);
      generateQrCode(data);
    }, 2000);
  }
});
customColorsBtn.addEventListener(`click`, toggleColorGroup);
inputFile.addEventListener(`change`, (e) => scan(e.target.files[0]));
copyBtn.addEventListener(`click`, () => copyToClipboard(scanResult.value));
// drag area
dropArea.addEventListener(`dragenter`, (e) => {
  e.preventDefault();
  highlight();
});
dropArea.addEventListener(`dragleave`, (e) => unHighlight());
dropArea.addEventListener(`dragover`, (e) => e.preventDefault());
// In order to have the drop event occur on a div element, you must cancel the ondragenter and ondragover
dropArea.addEventListener(`drop`, (e) => {
  e.preventDefault();
  unHighlight();
  const file = e.dataTransfer.files[0];
  setTimeout(() => {
    scan(file);
  }, 50);
});
