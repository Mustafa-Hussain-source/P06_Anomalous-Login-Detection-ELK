from __future__ import annotations

import unittest

import httpx

from app.main import app


class ExtendedApiTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        transport = httpx.ASGITransport(app=app)
        self.client = httpx.AsyncClient(transport=transport, base_url='http://test')
        await self.client.post('/events/clear?seed=true')
        await self.client.post('/traffic/stop')

    async def asyncTearDown(self) -> None:
        await self.client.aclose()

    async def test_analytics_kpi(self):
        response = await self.client.get('/analytics/kpi')
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn('total_events', payload)
        self.assertIn('suspicious_events', payload)
        self.assertIn('avg_risk', payload)

    async def test_detection_rules_and_backtest(self):
        rules_response = await self.client.get('/detection-rules')
        self.assertEqual(rules_response.status_code, 200)
        rules = rules_response.json()
        self.assertTrue(len(rules) > 0)

        rule_id = rules[0]['id']
        backtest_response = await self.client.get(f'/detection-rules/{rule_id}/backtest?days=7')
        self.assertEqual(backtest_response.status_code, 200)
        payload = backtest_response.json()
        self.assertIn('events_evaluated', payload)
        self.assertIn('hit_rate', payload)

    async def test_weekly_report(self):
        response = await self.client.get('/reports/weekly')
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn('events_total', payload)
        self.assertIn('mitigations_total', payload)
        self.assertIn('events_by_action', payload)

    async def test_event_triage_update_and_enriched_view(self):
        events_response = await self.client.get('/events?limit=1')
        self.assertEqual(events_response.status_code, 200)
        event_id = events_response.json()[0]['id']

        triage_response = await self.client.post(
            f'/events/{event_id}/triage',
            json={
                'status': 'in_review',
                'analyst': 'qa-analyst',
                'severity': 'high',
                'notes': 'verify alert path',
            },
        )
        self.assertEqual(triage_response.status_code, 200)
        triage_payload = triage_response.json()
        self.assertEqual(triage_payload['status'], 'in_review')

        enriched_response = await self.client.get('/events/enriched?limit=50')
        self.assertEqual(enriched_response.status_code, 200)
        enriched_payload = enriched_response.json()

        updated_row = next((row for row in enriched_payload if row['id'] == event_id), None)
        self.assertIsNotNone(updated_row)
        self.assertEqual(updated_row['triage']['analyst'], 'qa-analyst')
        self.assertEqual(updated_row['triage']['severity'], 'high')

    async def test_case_create_and_patch(self):
        events_response = await self.client.get('/events?limit=2')
        self.assertEqual(events_response.status_code, 200)
        event_ids = [row['id'] for row in events_response.json()[:2]]

        create_response = await self.client.post(
            '/cases',
            json={
                'title': 'Bruteforce Incident',
                'status': 'open',
                'priority': 'high',
                'owner': 'soc-tier2',
                'summary': 'Case created during integration tests',
                'event_ids': event_ids,
            },
        )
        self.assertEqual(create_response.status_code, 200)
        case_id = create_response.json()['id']

        patch_response = await self.client.patch(
            f'/cases/{case_id}',
            json={
                'status': 'in_progress',
                'owner': 'soc-incident-lead',
            },
        )
        self.assertEqual(patch_response.status_code, 200)
        patch_payload = patch_response.json()
        self.assertEqual(patch_payload['status'], 'in_progress')
        self.assertEqual(patch_payload['owner'], 'soc-incident-lead')

        list_response = await self.client.get('/cases?limit=25')
        self.assertEqual(list_response.status_code, 200)
        case_row = next((row for row in list_response.json() if row['id'] == case_id), None)
        self.assertIsNotNone(case_row)
        self.assertTrue(all(event_id in case_row['event_ids'] for event_id in event_ids))

    async def test_policy_update(self):
        policies_response = await self.client.get('/policies')
        self.assertEqual(policies_response.status_code, 200)
        policies = policies_response.json()
        self.assertTrue(len(policies) > 0)

        target = policies[0]
        update_response = await self.client.patch(f"/policies/{target['id']}", json={'value': 'TEST-VALUE'})
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.json()['value'], 'TEST-VALUE')

        verify_response = await self.client.get('/policies')
        self.assertEqual(verify_response.status_code, 200)
        verify_target = next((row for row in verify_response.json() if row['id'] == target['id']), None)
        self.assertIsNotNone(verify_target)
        self.assertEqual(verify_target['value'], 'TEST-VALUE')

    async def test_ticket_and_access_restriction_lifecycle(self):
        ticket_create = await self.client.post(
            '/containment/tickets',
            json={
                'entity': 'ip:8.8.8.8',
                'severity': 'critical',
                'summary': 'Contain suspected brute force source',
            },
        )
        self.assertEqual(ticket_create.status_code, 200)
        ticket_id = ticket_create.json()['id']

        ticket_patch = await self.client.patch(f'/containment/tickets/{ticket_id}?status=closed')
        self.assertEqual(ticket_patch.status_code, 200)
        self.assertEqual(ticket_patch.json()['status'], 'closed')

        restriction_create = await self.client.post(
            '/access-restrictions',
            json={
                'target_type': 'ip',
                'target_value': '8.8.8.8',
                'reason': 'Automated integration test',
                'expires_at': '2030-01-01T00:00:00+00:00',
            },
        )
        self.assertEqual(restriction_create.status_code, 200)
        restriction_id = restriction_create.json()['id']
        self.assertTrue(restriction_create.json()['active'])

        restriction_delete = await self.client.delete(f'/access-restrictions/{restriction_id}')
        self.assertEqual(restriction_delete.status_code, 200)
        self.assertFalse(restriction_delete.json()['active'])

    async def test_graph_health_and_export_endpoints(self):
        graph_response = await self.client.get('/investigation/graph?limit=50')
        self.assertEqual(graph_response.status_code, 200)
        graph = graph_response.json()
        self.assertIn('nodes', graph)
        self.assertIn('edges', graph)
        self.assertGreater(len(graph['nodes']), 0)

        health_response = await self.client.get('/ingestion/health')
        self.assertEqual(health_response.status_code, 200)
        health = health_response.json()
        self.assertEqual(health['status'], 'healthy')
        self.assertIn('event_count', health)

        export_response = await self.client.get('/reports/export?limit=10')
        self.assertEqual(export_response.status_code, 200)
        export_payload = export_response.json()
        self.assertIn('events', export_payload)
        self.assertIn('mitigations', export_payload)


if __name__ == '__main__':
    unittest.main()
