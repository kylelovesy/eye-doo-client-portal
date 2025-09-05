// src/lib/useEntityManagement.ts
import { useState } from 'react';

export function useEntityManagement<T extends { id: string }>(
    items: T[],
    updateItems: (newItems: T[]) => void
) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntity, setEditingEntity] = useState<T | null>(null);

    const openAddModal = () => {
        setEditingEntity(null);
        setIsModalOpen(true);
    };

    const openEditModal = (entity: T) => {
        setEditingEntity(entity);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingEntity(null);
    };

    const handleDelete = (entityId: string) => {
        const updatedItems = items.filter(item => item.id !== entityId);
        updateItems(updatedItems);
    };

    const handleSave = (entityData: Omit<T, 'id'>) => {
        if (editingEntity) {
            // Update
            const updatedItems = items.map(item =>
                item.id === editingEntity.id ? { ...item, ...entityData } : item
            );
            updateItems(updatedItems);
        } else {
            // Add
            const newItem = {
                id: `item_${Date.now()}`,
                ...entityData,
            } as T;
            updateItems([...items, newItem]);
        }
        closeModal();
    };

    return {
        isModalOpen,
        editingEntity,
        openAddModal,
        openEditModal,
        closeModal,
        handleDelete,
        handleSave,
    };
}
