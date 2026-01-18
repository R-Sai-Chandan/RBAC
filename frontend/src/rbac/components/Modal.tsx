export function Modal({ isOpen, onClose, title, children }: any) {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal__header">
                    <h3 className="modal__title">{title}</h3>
                    <button onClick={onClose} className="modal__close">&times;</button>
                </div>
                {children}
            </div>
        </div>
    );
}
