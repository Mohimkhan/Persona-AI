import { LOGOUT_MODAL_ID } from "@/constants";

const LogoutModal = ({
  onConfirmation = () => {},
  onCancellation = () => {},
}) => {
  return (
    <>
      <dialog
        id={LOGOUT_MODAL_ID}
        className="modal"
      >
        <div className="modal-box py-[15px] px-[10px] rounded-lg sm:py-5 sm:px-[15px]">
          <h3 className="font-bold text-lg">Logout Confirmation</h3>
          <p className="py-4">Are you sure you want to logout? 🤔</p>
          <div className="modal-action mt-0">
            <button
              className="bg-green-500 rounded-md px-4 h-7 text-sm hover:scale-95 hover:opacity-75"
              onClick={onConfirmation}
            >
              Yes
            </button>
            <form method="dialog">
              <button
                className="bg-red-500 rounded-md px-4 h-7 text-sm hover:scale-95 hover:opacity-75"
                onClick={onCancellation}
              >
                No
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
};
export default LogoutModal;
