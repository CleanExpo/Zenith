import { KanbanComponent, ColumnsDirective, ColumnDirective } from "@syncfusion/ej2-react-kanban";
import * as React from 'react';
import { useEffect, useState } from 'react';
import { getCacheStats } from '@/lib/services/cacheService';
import './KanbanBoard.css';

function KanbanBoard() {
const [cacheStats, setCacheStats] = useState<{ totalEntries: number; totalSize: number; hitRate: number; avgAccessCount: number; tagStats: { [key: string]: number; } } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCacheStats = async () => {
            try {
                const stats = await getCacheStats();
                setCacheStats(stats);
            } catch (error) {
                console.error('Error fetching cache stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCacheStats();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!cacheStats) {
        return <div>Error loading cache stats</div>;
    }

const data = [
    { Id: 1, Status: 'Open', Summary: `Total Entries: ${cacheStats ? cacheStats.totalEntries : 'N/A'}`, Type: 'Info', Priority: 'Low', Tags: 'Cache', Estimate: cacheStats ? cacheStats.totalSize : 'N/A', Assignee: 'System', RankId: 1 },
    { Id: 2, Status: 'InProgress', Summary: `Hit Rate: ${cacheStats ? (cacheStats.hitRate * 100).toFixed(2) + '%' : 'N/A'}`, Type: 'Info', Priority: 'Low', Tags: 'Cache', Estimate: cacheStats ? cacheStats.avgAccessCount : 'N/A', Assignee: 'System', RankId: 1 },
    { Id: 3, Status: 'Testing', Summary: `Average Access Count: ${cacheStats ? cacheStats.avgAccessCount : 'N/A'}`, Type: 'Info', Priority: 'Low', Tags: 'Cache', Estimate: cacheStats ? cacheStats.totalEntries : 'N/A', Assignee: 'System', RankId: 1 },
    { Id: 4, Status: 'Close', Summary: `Tag Stats: ${cacheStats ? JSON.stringify(cacheStats.tagStats) : 'N/A'}`, Type: 'Info', Priority: 'Low', Tags: 'Cache', Estimate: cacheStats ? cacheStats.totalSize : 'N/A', Assignee: 'System', RankId: 1 },
];

    return (
        <div className="App">
            <KanbanComponent id="kanban" keyField="Status" dataSource={data} cardSettings={{ contentField: "Summary", headerField: "Id" }}>
                <ColumnsDirective>
                    <ColumnDirective headerText="To Do" keyField="Open"/>
                    <ColumnDirective headerText="In Progress" keyField="InProgress"/>
                    <ColumnDirective headerText="Testing" keyField="Testing"/>
                    <ColumnDirective headerText="Done" keyField="Close"/>
                </ColumnsDirective>
            </KanbanComponent>
        </div>
    );
}

export default KanbanBoard;
