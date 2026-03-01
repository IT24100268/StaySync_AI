import { useState } from 'react';
import MenuItemModal from '../components/menu/MenuItemModal';
import MenuItemsSection from '../components/menu/MenuItemsSection';
import { useFoodItems } from '../context/FoodItemsContext';
import { useToast } from '../context/ToastContext';

export default function MenuItemsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const { items, loading, error, createItem, updateItem, deleteItem, toggleAvailability } = useFoodItems();
  const { addToast } = useToast();

  const openAddModal = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleSave = async (payload) => {
    if (editingItem) {
      await updateItem(editingItem.id, payload);
      addToast({ title: 'Item updated', message: `${editingItem.name} saved successfully.`, variant: 'success' });
    } else {
      await createItem(payload);
      addToast({ title: 'Item added', message: 'New menu item added to your dashboard.', variant: 'success' });
    }
    setEditingItem(null);
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete ${item.name}? This cannot be undone.`);
    if (!confirmed) {
      return;
    }
    await deleteItem(item.id);
    addToast({ title: 'Item deleted', message: `${item.name} removed from the menu.`, variant: 'success' });
  };

  const handleToggle = async (item) => {
    await toggleAvailability(item.id);
    addToast({
      title: 'Availability updated',
      message: `${item.name} is now ${item.is_available ? 'out of stock' : 'available'}.`,
      variant: 'info',
    });
  };

  return (
    <div className="space-y-6">
      <MenuItemsSection
        items={items}
        loading={loading}
        error={error}
        onAdd={openAddModal}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onToggle={handleToggle}
      />

      <MenuItemModal
        open={modalOpen}
        item={editingItem}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
      />
    </div>
  );
}
