import Swal from 'sweetalert2';

export function confirmDelete(entity: string) {
  return Swal.fire({
    title: `Delete ${entity}?`,
    text: `This will be backed up for 30 days before permanent removal.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#737373',
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    background: '#fff',
  });
}

export function toastSuccess(msg: string) {
  Swal.fire({
    text: msg,
    icon: 'success',
    timer: 2000,
    showConfirmButton: false,
    toast: true,
    position: 'top-end',
    background: '#fff',
  });
}

export function toastError(msg: string) {
  Swal.fire({
    text: msg,
    icon: 'error',
    timer: 3000,
    showConfirmButton: false,
    toast: true,
    position: 'top-end',
    background: '#fff',
  });
}
